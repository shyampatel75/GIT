# Generated by Django 5.2 on 2025-05-20 10:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_backend', '0033_other_transaction_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='other',
            name='transaction_type',
            field=models.CharField(blank=True, choices=[('credit', 'Credit'), ('debit', 'Debit')], default='debit', max_length=6, null=True),
        ),
    ]
