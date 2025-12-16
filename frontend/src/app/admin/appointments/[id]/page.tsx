"use client";

import React, { useState, useEffect, useCallback, useReducer } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Appointment, AppointmentHistory, Doctor, Service } from "@/lib/types";
import { ArrowLeft, Check, X, History as HistoryIcon, } from "lucide-react";
import { format, parseISO } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "lucide-react";
import TimePicker from "react-time-picker";
import { ClockIcon } from "lucide-react";
import 'react-time-picker/dist/TimePicker.css';

import { EnhancedCalendarView } from "@/components/calendar/EnhancedCalendarView";
import {
  validateAppointment,
  checkAppointmentConflict,
  getDoctorName,
  getServiceName,
} from "@/lib/appointment-sync";
import { calendarSyncManager } from "@/lib/calendar-sync";

// State management for synchronized form + calendar
// Uses a single source of truth with useReducer to manage:
// - selectedDoctor: Currently selected doctor ID
// - selectedDate: Currently selected appointment date
// - selectedTime: Currently selected appointment time
// - selectedService: Currently selected service ID
// - appointments: Array of appointments for conflict detection
interface AppointmentState {
  selectedDoctor: number | null;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedService: number | null;
  appointments: Appointment[];
}

type AppointmentAction =
  | { type: 'SET_DOCTOR'; payload: number | null }
  | { type: 'SET_DATE'; payload: string | null }
  | { type: 'SET_TIME'; payload: string | null }
  | { type: 'SET_SERVICE'; payload: number | null }
  | { type: 'SET_SLOT'; payload: { date: string; time: string } }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment };

function appointmentReducer(state: AppointmentState, action: AppointmentAction): AppointmentState {
  switch (action.type) {
    case 'SET_DOCTOR':
      return { ...state, selectedDoctor: action.payload };
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_TIME':
      return { ...state, selectedTime: action.payload };
    case 'SET_SERVICE':
      return { ...state, selectedService: action.payload };
    case 'SET_SLOT':
      return {
        ...state,
        selectedDate: action.payload.date,
        selectedTime: action.payload.time
      };
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload };
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(apt =>
          apt.id === action.payload.id ? action.payload : apt
        )
      };
    default:
      return state;
  }
}

const safeFormatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? "N/A" : format(parsed, "MMM dd, yyyy HH:mm");
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Synchronized state management
  const [appointmentState, dispatch] = useReducer(appointmentReducer, {
    selectedDoctor: null,
    selectedDate: null,
    selectedTime: null,
    selectedService: null,
    appointments: [],
  });

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const fetchAppointment = useCallback(async () => {
    try {
      const data = await apiClient.get<Appointment>(`/api/appointments/${id}/`);
      setAppointment(data);
      setAdminNotes(data.admin_notes || "");
    } catch (err: any) {
      setError(err.message || "Failed to fetch appointment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchHistory = useCallback(async () => {
    try {
      // Try to fetch history for this specific appointment
      const response = await apiClient.get<any>("/api/history/", {
        appointment: id,
      });

      if (response.results) {
        setHistory(response.results);
      } else if (Array.isArray(response)) {
        setHistory(response.filter((h: AppointmentHistory) => h.appointment === Number(id)));
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, [id]);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await apiClient.get<any>("/api/doctors/");
      if (response.results) {
        setDoctors(response.results);
      } else if (Array.isArray(response)) {
        setDoctors(response);
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const response = await apiClient.get<any>("/api/services/");
      if (response.results) {
        setServices(response.results);
      } else if (Array.isArray(response)) {
        setServices(response);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  }, []);

  // Filter doctors based on selected service
  useEffect(() => {
    if (selectedServiceId && doctors.length > 0) {
      // Filter doctors who provide the selected service
      // Assuming doctors have a services array or similar relationship
      // For now, show all doctors - adjust based on your API structure
      setFilteredDoctors(doctors);
    } else if (doctors.length > 0) {
      setFilteredDoctors(doctors);
    }
  }, [selectedServiceId, doctors]);

  // Initialize synchronized state with appointment data
  useEffect(() => {
    if (appointment) {
      dispatch({ type: 'SET_DOCTOR', payload: appointment.doctor });
      dispatch({ type: 'SET_DATE', payload: appointment.appointment_date });
      dispatch({ type: 'SET_TIME', payload: appointment.appointment_time });
      dispatch({ type: 'SET_SERVICE', payload: typeof appointment.service === 'string' ? parseInt(appointment.service) : appointment.service });
    }
  }, [appointment]);

  // Handler for slot clicks from calendar - enhanced two-way sync
  const handleSlotClick = useCallback((date: string, time: string) => {
    // Update synchronized state first
    dispatch({ type: 'SET_SLOT', payload: { date, time } });
    
    // Then update appointment state
    setAppointment(prev => prev ? {
      ...prev,
      appointment_date: date,
      appointment_time: time
    } : null);
    
    // Clear any existing errors when user makes a selection
    setError("");
  }, []);

  // Handler for form changes that should sync to calendar - enhanced with validation
  const handleDoctorChange = useCallback((doctorId: number | null) => {
    dispatch({ type: 'SET_DOCTOR', payload: doctorId });
    setAppointment(prev => prev ? { ...prev, doctor: doctorId } : null);
    
    // Trigger calendar refresh to load new doctor's appointments
    setCalendarRefreshKey((prev) => prev + 1);
  }, []);

  const handleDateChange = useCallback((date: string) => {
    dispatch({ type: 'SET_DATE', payload: date });
    setAppointment(prev => prev ? { ...prev, appointment_date: date } : null);
    
    // Clear any time conflicts when date changes
    setError("");
  }, []);

  const handleTimeChange = useCallback((time: string) => {
    dispatch({ type: 'SET_TIME', payload: time });
    setAppointment(prev => prev ? { ...prev, appointment_time: time } : null);
    
    // Clear any time conflicts when time changes
    setError("");
  }, []);

  // Subscribe to calendar sync events for real-time updates
  useEffect(() => {
    const unsubscribe = calendarSyncManager.subscribe((event) => {
      switch (event.type) {
        case 'appointment_created':
        case 'appointment_updated':
        case 'appointment_deleted':
          // Refresh appointments when changes occur
          setCalendarRefreshKey((prev) => prev + 1);
          break;
        case 'slot_selected':
          // Handle slot selection from other calendar instances
          if (event.data.date !== appointmentState.selectedDate || 
              event.data.time !== appointmentState.selectedTime) {
            // Use dispatch directly to avoid circular dependency
            dispatch({ type: 'SET_SLOT', payload: { date: event.data.date, time: event.data.time } });
            setAppointment(prev => prev ? {
              ...prev,
              appointment_date: event.data.date,
              appointment_time: event.data.time
            } : null);
            setError("");
          }
          break;
      }
    });

    return unsubscribe;
  }, [appointmentState.selectedDate, appointmentState.selectedTime, dispatch]);

  useEffect(() => {
    if (id) {
      fetchAppointment();
      fetchHistory();
      fetchDoctors();
      fetchServices();
    }
  }, [id, fetchAppointment, fetchHistory, fetchDoctors, fetchServices]);

  // Save appointment changes with validation
  const handleSaveAppointment = async () => {
    if (!appointment) return;

    // Validate appointment
    const validation = validateAppointment(appointment);
    if (!validation.isValid) {
      setError(validation.errors.join(", "));
      return;
    }

    // Check for conflicts
    const hasConflict = checkAppointmentConflict(appointment, [appointment], id);
    if (hasConflict) {
      setError(
        "This time slot conflicts with another appointment for the same doctor"
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updateData = {
        name: appointment.name,
        email: appointment.email,
        phone: appointment.phone,
        service: appointment.service,
        doctor: appointment.doctor,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        message: appointment.message,
        admin_notes: adminNotes,
      };

      const updated = await apiClient.patch<Appointment>(
        `/api/appointments/${id}/`,
        updateData
      );

      setAppointment(updated);
      setError("");
      alert("Appointment saved successfully!");
      
      // Emit sync event for real-time updates
      calendarSyncManager.emitAppointmentUpdated(updated);
    } catch (err: any) {
      setError(err.message || "Failed to save appointment");
      console.error("Error saving appointment:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!appointment) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus.toLowerCase()} this appointment?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      // Save all changes and update status
      const updateData: any = {
        name: appointment.name,
        email: appointment.email,
        phone: appointment.phone,
        service: appointment.service,
        doctor: appointment.doctor,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        message: appointment.message,
        admin_notes: adminNotes,
        status: newStatus,
      };

      console.log("Sending update data to backend:", updateData);

      const updated = await apiClient.patch<Appointment>(
        `/api/appointments/${id}/`,
        updateData
      );

      console.log("Backend response:", updated);

      setAppointment(updated);
      alert(`Appointment ${newStatus.toLowerCase()} successfully!`);

      // Refresh history to show the new entry
      await fetchHistory();
      
      // Emit sync event for real-time updates
      calendarSyncManager.emitAppointmentUpdated(updated);

      // ✅ Django deletes approved/rejected appointments - redirect to list
      // The appointment is now in history, not in active appointments
      setTimeout(() => {
        router.push("/admin/appointments");
      }, 1500);
    } catch (err: any) {
      setError(err.message || `Failed to ${newStatus.toLowerCase()} appointment`);
      console.error("Error details:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!appointment) return;

    setSaving(true);
    setError("");

    try {
      const updated = await apiClient.patch<Appointment>(
        `/api/appointments/${id}/`,
        {
          admin_notes: adminNotes,
        }
      );

      setAppointment(updated);
      alert("Notes saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading appointment...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!appointment) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-600 mb-4">Appointment not found</p>
          <button
            onClick={() => router.push("/admin/appointments")}
            className="text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Back to Appointments
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/appointments")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Appointment #{appointment.id}
              </h1>
              <p className="text-gray-600 mt-1">View and manage appointment details</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(
              appointment.status
            )}`}
          >
            {appointment.status}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">          {/* Main content */}
          <div className=" space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Patient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={appointment.name ?? ""}
                    onChange={(e) => setAppointment({ ...appointment, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={appointment.email || ""}
                    onChange={(e) => setAppointment({ ...appointment, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={appointment.phone ?? ""}
                    onChange={(e) => setAppointment({ ...appointment, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <select
                    value={appointment.service ?? ""}
                    onChange={(e) => {
                      const serviceId = e.target.value ? Number(e.target.value) : 0;
                      setSelectedServiceId(serviceId || null);
                      setAppointment({ ...appointment, service: serviceId, doctor: null });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Service</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor
                  </label>
                  <select
                    value={appointment.doctor ?? ""}
                    onChange={(e) => handleDoctorChange(e.target.value ? Number(e.target.value) : null)}
                    disabled={!appointment.service}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {appointment.service ? "Select Doctor (Optional)" : "Select a service first"}
                    </option>
                    {doctors
                      .filter((doc) => doc.service === appointment.service)
                      .map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Date
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Calendar icon triggers the datepicker */}
                    <DatePicker
                      selected={appointment.appointment_date ? new Date(appointment.appointment_date) : null}
                      onChange={(date: Date | null) => {
                        const dateStr = date?.toISOString().split('T')[0];
                        if (dateStr) {
                          handleDateChange(dateStr);
                        }
                      }}
                      customInput={
                        <div className="flex items-center cursor-pointer px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 w-full">
                          <CalendarIcon className="h-7 w-7 text-gray-500 mr-2" />
                          <input
                            type="text"
                            value={appointment.appointment_date ?? ""}
                            readOnly
                            className="w-full bg-transparent text-gray-700 outline-none"
                          />
                        </div>
                      }
                      dateFormat="yyyy-MM-dd"
                    />
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Time
                  </label>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-7 w-7 text-gray-500" />
                    <TimePicker
                      onChange={(time: string | null) => {
                        if (time) {
                          handleTimeChange(time);
                        }
                      }}
                      value={appointment?.appointment_time ?? ""}
                      disableClock={true} // hides the analog clock, optional
                      clearIcon={null}     // hides clear button, optional
                      className="w-full"
                    />
                  </div>
                </div>


                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={appointment.message || ""}
                    onChange={(e) => setAppointment({ ...appointment, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>

                {/* Save Changes Button */}
                <div className="md:col-span-2">
                  <button
                    onClick={handleSaveAppointment}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-medium"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Admin Notes
              </h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                placeholder="Add internal notes about this appointment..."
              />
              <p className="text-sm text-gray-500 mt-2">
                ℹ️ Notes and all changes will be saved when you click Approve or Reject
              </p>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <HistoryIcon className="w-5 h-5 mr-2" />
                    History
                  </h2>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-cyan-600 hover:text-cyan-700"
                  >
                    {showHistory ? "Hide" : "Show"}
                  </button>
                </div>

                {showHistory && (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="border-l-4 border-cyan-500 pl-4 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.previous_status} → {entry.new_status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {safeFormatDate(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Changed by: {entry.changed_by}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            Notes: {entry.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900">
                    {safeFormatDate(appointment.created_at)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Updated At
                  </label>
                  <p className="text-sm text-gray-900">
                    {safeFormatDate(appointment.updated_at)}
                  </p>

                </div>
                {appointment.doctor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Doctor
                    </label>
                    <p className="text-sm text-gray-900">
                      {doctors.find((d) => d.id === appointment.doctor)?.name || `Doctor #${appointment.doctor}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
                

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor Schedule</h2>
              {appointment && appointment.doctor && (
                <div className="space-y-4">
                  <div className="mb-4 text-sm text-gray-600">
                    {appointment.doctor_details && (
                      <p className="font-medium">Doctor: Dr. {appointment.doctor_details.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Showing appointments for the selected doctor</p>
                  </div>
                  <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
                    <EnhancedCalendarView
                      doctorId={appointment.doctor as number}
                      initialDate={appointment.appointment_date}
                      view="day"
                      className="h-full"
                      selectedSlot={appointmentState.selectedDate && appointmentState.selectedTime ? {
                        date: appointmentState.selectedDate,
                        time: appointmentState.selectedTime
                      } : undefined}
                      onSlotClick={handleSlotClick}
                      onStateChange={(state) => {
                        // Update form when calendar state changes
                        const dateStr = format(state.date, 'yyyy-MM-dd');
                        handleDateChange(dateStr);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Actions */}
            {appointment.status === "PENDING" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusChange("APPROVED")}
                    disabled={saving}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {saving ? "Saving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleStatusChange("REJECTED")}
                    disabled={saving}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    <X className="w-5 h-5 mr-2" />
                    {saving ? "Saving..." : "Reject"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
)}
