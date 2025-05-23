# Generated by Django 5.2 on 2025-05-16 04:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_backend', '0030_bankingdeposit_remaining_amount'),
    ]

    operations = [
        migrations.CreateModel(
            name='RemainingAmount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('last_updated', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.RemoveField(
            model_name='bankingdeposit',
            name='remaining_amount',
        ),
    ]
