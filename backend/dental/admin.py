from django.contrib import admin
from django.contrib.admin import register
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from import_export.admin import ImportExportModelAdmin
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.contrib.import_export.forms import (ExportForm, ImportForm,
                                                SelectableFieldsExportForm)
from unfold.forms import (AdminPasswordChangeForm, UserChangeForm,
                          UserCreationForm)

from .models import Appointment, AppointmentHistory, Doctor, Feedback, Service

admin.site.unregister(User)



@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    # Forms loaded from `unfold.forms`
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


@admin.register(Service)
class ServiceAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('id', 'name')
    list_display_links = ('id', 'name')
    search_fields = ('name',)
    import_Form_class = ImportForm
    export_Form_class = ExportForm



@admin.register(Appointment)
class AppointmentAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('id', 'name', 'phone','status', 'appointment_date',  'created_at')
    list_display_links = ('id', 'name', 'phone')
    list_filter = [
        'status', 
        'appointment_date', 
        'service',
        'doctor',
        ('created_at', RangeDateFilter)
        ]
    list_filter_submit = True
    readonly_fields = ('name', 'email', 'phone', 'created_at', 'updated_at')
    exclude = ('status',)
    fields = (
        'name', 'email', 'phone', 'service', 'doctor',
        'appointment_date', 'appointment_time', 'message',
         'admin_notes', 'created_at', 'updated_at'
    )
    change_form_template = "unfold/admin/item_change_form.html"

    import_Form_class = ImportForm
    export_Form_class = ExportForm

    def save_model(self, request, obj, form, change):
        if "_approve" in request.POST:
            obj.status = "APPROVED"
        elif "_disapprove" in request.POST:
            obj.status = "REJECTED"

        if change:
            print("this is object")
            print(obj)
            old = Appointment.objects.get(pk=obj.pk)
            if old.status != obj.status:
                doc = old.doctor
                AppointmentHistory.objects.create(
                    appointment=obj,
                    name=old.name,
                    email=old.email,
                    phone=old.phone,
                    service_name=old.service.name if old.service else None,
                    appointment_date=old.appointment_date,
                    appointment_time=old.appointment_time,
                    message=old.message,
                    doctor_id=getattr(doc, 'id', None),
                    doctor_name=getattr(doc, 'name', None),
                    previous_status=old.status,
                    new_status=obj.status,
                    changed_by=str(request.user),
                    notes=obj.admin_notes or ''
                )
                if obj.status in ('APPROVED', 'REJECTED'):
                    obj.delete()
                    return
        super().save_model(request, obj, form, change)

    def response_add(self, request, obj, post_url_continue=None):
        """Ignore "Save and add another" and "Save and continue editing" for Appointment admin.
        Always behave like a plain Save (redirect to changelist) when those buttons are used.
        """
        from django.http import HttpResponseRedirect
        from django.urls import reverse

        if request.POST.get('_addanother') or request.POST.get('_continue'):
            changelist = reverse('admin:%s_%s_changelist' % (self.model._meta.app_label, self.model._meta.model_name))
            return HttpResponseRedirect(changelist)
        return super().response_add(request, obj, post_url_continue=post_url_continue)

    def response_change(self, request, obj):
        """Ignore the continue/add flags on change as well and behave like Save."""
        from django.http import HttpResponseRedirect
        from django.urls import reverse

        if request.POST.get('_addanother') or request.POST.get('_continue'):
            changelist = reverse('admin:%s_%s_changelist' % (self.model._meta.app_label, self.model._meta.model_name))
            return HttpResponseRedirect(changelist)
        return super().response_change(request, obj)


@admin.register(AppointmentHistory)
class AppointmentHistoryAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('id', 'name', 'phone', 'previous_status', 'new_status',  'changed_by', 'visited', 'timestamp')
    list_display_links = ('id', 'name', 'phone')
    list_filter = ('previous_status', 'new_status', 'changed_by', 'visited', 'timestamp')
    readonly_fields = (
        'appointment', 'name', 'email', 'phone', 'doctor_id', 'doctor_name',
        'previous_status', 'new_status', 'changed_by', 'notes', 'timestamp'
    )
    fields = (
        'appointment', 'name', 'email', 'phone', 'doctor_id', 'doctor_name',
        'service_name', 'appointment_date', 'appointment_time', 'message',
        'previous_status', 'new_status',  'changed_by', 'notes', 'visited', 'timestamp'
    )
    import_Form_class = ImportForm
    export_Form_class = ExportForm


@admin.register(Doctor)
class DoctorAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('id', 'name', 'service', 'active')
    list_display_links = ('id', 'name', 'service', 'active')  # ✅ All columns clickable
    list_filter = ('service', 'active')
    search_fields = ('name', 'service')
    import_Form_class = ImportForm
    export_Form_class = ExportForm


@admin.register(Feedback)
class FeedbackAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('id', 'name', 'phone', 'created_at')
    list_display_links = ('id', 'name', 'phone')
    readonly_fields = ('name', 'phone', 'message', 'created_at')
    list_filter = [('created_at', RangeDateFilter)]
    import_Form_class = ImportForm
    export_Form_class = ExportForm

class GlobalAdminMedia:
    css = {'all': ('css/admin/custom.css',)}  # Path inside static folder

admin.site.__class__.Media = GlobalAdminMedia