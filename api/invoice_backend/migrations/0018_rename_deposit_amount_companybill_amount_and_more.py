# Generated by Django 5.2 on 2025-05-01 04:56

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_backend', '0017_alter_buyer_company_name_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='companybill',
            old_name='deposit_amount',
            new_name='amount',
        ),
        migrations.RemoveField(
            model_name='buyer',
            name='company_amount',
        ),
        migrations.RemoveField(
            model_name='buyer',
            name='company_date',
        ),
        migrations.RemoveField(
            model_name='buyer',
            name='company_name',
        ),
        migrations.RemoveField(
            model_name='companybill',
            name='buyer_name',
        ),
        migrations.RemoveField(
            model_name='companybill',
            name='invoice_id',
        ),
        migrations.RemoveField(
            model_name='companybill',
            name='selected_date',
        ),
        migrations.AddField(
            model_name='buyer',
            name='buyer_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='buyer',
            name='deposit_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='buyer',
            name='invoice_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='buyer',
            name='transaction_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='companybill',
            name='company_name',
            field=models.CharField(default='Unknown', max_length=255),
        ),
        migrations.AddField(
            model_name='companybill',
            name='transaction_date',
            field=models.DateField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='buyer',
            name='notice',
            field=models.CharField(default='', max_length=255),
        ),
        migrations.AlterField(
            model_name='companybill',
            name='notice',
            field=models.TextField(default='No remarks'),
        ),
    ]
