# Sistema de Monedas

## Configuración

| Aspecto | Valor |
|---------|-------|
| Moneda base | MXN |
| Admin elige | Moneda predeterminada del sitio |
| Usuario puede | Cambiar moneda en header |
| Conversión | Dinámica vs MXN |

## Monedas Soportadas

- MXN (Peso Mexicano) - base
- USD (Dólar)
- COP (Peso Colombiano)
- ARS (Peso Argentino)
- PEN (Sol Peruano)
- EUR (Euro)

## Precio Base

- 100 V-Bucks = 7.5 MXN (default)
- Admin puede cambiar este ratio
- Productos de V-Bucks/Crew tienen precio asignado por admin (diferente al ratio de regalo)

## Conversión Dinámica

- Obtener tasa de cambio vs MXN desde API externa
- Actualizar periódicamente (cada X horas)
- Fallback: última tasa válida o tasa manual del admin

## Selector de Moneda

### Header (usuario)
```
[ MXN ▼ ]
```
Dropdown con todas las monedas soportadas.

### Admin Settings
```
Moneda predeterminada del sitio:
[ MXN ▼ ]
```

## Visualización

```
Spider-Man
1,500 V-Bucks
$112.50 MXN  ← (o equivalente en moneda seleccionada)
```

## Estructura DB

### exchange_rates
```
id, currency_code, rate_to_mxn,
source, fetched_at,
created_at, updated_at
```

### currency_settings
```
id, default_currency, vbucks_rate_mxn,
updated_by, updated_at
```

## Reglas

- Siempre almacenar precios base en MXN
- Convertir al mostrar
- Redondear a 2 decimales
- Mostrar símbolo de moneda según locale
- Admin puede forzar tasa fija si needed
