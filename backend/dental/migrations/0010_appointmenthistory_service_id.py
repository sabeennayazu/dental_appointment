# Generated migration for adding service_id field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dental', '0009_create_default_services'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointmenthistory',
            name='service_id',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
