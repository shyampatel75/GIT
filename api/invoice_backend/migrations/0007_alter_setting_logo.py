# Generated by Django 5.1.5 on 2025-04-15 04:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_backend', '0006_rename_gst_consultancy_invoice_particulars_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='setting',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to=''),
        ),
    ]
