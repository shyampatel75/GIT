# Generated by Django 5.1.5 on 2025-04-17 06:30

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_backend', '0010_alter_invoice_invoice_number'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='invoice',
            name='invoice_number',
        ),
    ]
