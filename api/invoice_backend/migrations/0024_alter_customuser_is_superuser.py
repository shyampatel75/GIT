# Generated by Django 5.2 on 2025-05-13 08:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_backend', '0023_alter_customuser_options_alter_customuser_managers_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='is_superuser',
            field=models.BooleanField(default=False),
        ),
    ]
