from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Dodaje brakujace tabele i kolumny aplikacji portfolio (idempotentne)."

    def handle(self, *args, **options):
        models = apps.get_app_config("portfolio").get_models()
        with connection.schema_editor() as editor:
            for model in models:
                table = model._meta.db_table
                if table not in connection.introspection.table_names():
                    editor.create_model(model)
                    self.stdout.write(f"utworzono tabele {table}")
                    continue
                with connection.cursor() as cur:
                    cols = {c.name for c in connection.introspection.get_table_description(cur, table)}
                for f in model._meta.local_fields:
                    if f.column not in cols:
                        editor.add_field(model, f)
                        self.stdout.write(f"dodano kolumne {table}.{f.column}")
        self.stdout.write("schemat OK")
