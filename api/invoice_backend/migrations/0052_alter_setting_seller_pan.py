# Generated by Django 5.2 on 2025-06-05 06:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_backend', '0051_remove_setting_id_alter_setting_hsn_codes_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='setting',
            name='seller_pan',
            field=models.CharField(max_length=20),
        ),
    ]
