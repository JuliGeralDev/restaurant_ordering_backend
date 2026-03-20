# Guía de Datos de Muestra

Este documento explica cómo agregar, modificar o personalizar los datos de muestra (seed data) del proyecto.

## Estructura de Productos

Los productos se definen en `scripts/init-db.ts` en el array `SAMPLE_PRODUCTS`.

### Schema de Producto

```typescript
{
  productId: string;           // ID único del producto
  name: string;                // Nombre del producto
  description: string;         // Descripción detallada
  category: string;            // Categoría (burgers, pizzas, pastas, etc.)
  basePrice: number;           // Precio base en centavos (12000 = $120.00)
  available: boolean;          // Disponibilidad
  imageUrl: string;            // URL de la imagen
  modifierGroups: Array<{      // Grupos de modificadores
    groupId: string;
    name: string;
    required: boolean;         // ¿Es obligatorio seleccionar?
    multiSelect: boolean;      // ¿Se puede seleccionar más de uno?
    options: Array<{
      optionId: string;
      name: string;
      price: number;           // Precio adicional en centavos
    }>;
  }>;
}
```

## Agregar Nuevos Productos

### 1. Editar el archivo de inicialización

Abre `scripts/init-db.ts` y agrega tu producto al array `SAMPLE_PRODUCTS`:

```typescript
const SAMPLE_PRODUCTS = [
  // ... productos existentes
  {
    productId: 'nuevo-producto',
    name: 'Mi Nuevo Producto',
    description: 'Descripción del producto',
    category: 'mi-categoria',
    basePrice: 15000, // $150.00
    available: true,
    imageUrl: 'https://example.com/mi-producto.jpg',
    modifierGroups: [
      {
        groupId: 'tamano',
        name: 'Tamaño',
        required: true,
        multiSelect: false,
        options: [
          { optionId: 'pequeno', name: 'Pequeño', price: 0 },
          { optionId: 'grande', name: 'Grande', price: 3000 }
        ]
      }
    ]
  }
];
```

### 2. Re-ejecutar el script de inicialización

```bash
npm run init:db
```

## Categorías Predefinidas

El sistema incluye las siguientes categorías por defecto:

- `burgers` - Hamburguesas
- `pizzas` - Pizzas
- `pastas` - Pastas
- `salads` - Ensaladas
- `drinks` - Bebidas
- `desserts` - Postres

Puedes crear nuevas categorías simplemente usando un nuevo nombre en el campo `category`.

## Nota sobre Precios

**IMPORTANTE:** Los precios se almacenan en centavos para evitar problemas de precisión con decimales.

- $10.00 = 1000 centavos
- $12.50 = 1250 centavos
- $150.00 = 15000 centavos

## Grupos de Modificadores Comunes

### Tamaños
```typescript
{
  groupId: 'size',
  name: 'Tamaño',
  required: true,
  multiSelect: false,
  options: [
    { optionId: 'small', name: 'Pequeño', price: 0 },
    { optionId: 'medium', name: 'Mediano', price: 2000 },
    { optionId: 'large', name: 'Grande', price: 4000 }
  ]
}
```

### Extras
```typescript
{
  groupId: 'extras',
  name: 'Extras',
  required: false,
  multiSelect: true,
  options: [
    { optionId: 'extra-cheese', name: 'Queso extra', price: 2000 },
    { optionId: 'bacon', name: 'Tocineta', price: 3000 }
  ]
}
```

### Punto de Cocción
```typescript
{
  groupId: 'cooking-point',
  name: 'Punto de cocción',
  required: true,
  multiSelect: false,
  options: [
    { optionId: 'rare', name: 'Poco cocida', price: 0 },
    { optionId: 'medium', name: 'Término medio', price: 0 },
    { optionId: 'well-done', name: 'Bien cocida', price: 0 }
  ]
}
```

## Resetear Datos

Si quieres empezar desde cero:

```bash
# Detener DynamoDB
npm run docker:down

# Eliminar volumen (borra todos los datos)
docker volume rm dynamodb_data

# Reiniciar con datos frescos
npm run setup
```

## Consultar Productos Actuales

### Ver todos los productos
```bash
aws dynamodb scan \
  --table-name products \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### Ver un producto específico
```bash
aws dynamodb get-item \
  --table-name products \
  --key '{"productId":{"S":"burger-classic"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### Contar productos
```bash
aws dynamodb scan \
  --table-name products \
  --select COUNT \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

## Eliminar un Producto

```bash
aws dynamodb delete-item \
  --table-name products \
  --key '{"productId":{"S":"producto-a-eliminar"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

## Mejores Prácticas

1. **IDs únicos:** Usa kebab-case para los IDs (`burger-classic`, no `Burger Classic`)
2. **Precios en centavos:** Siempre usa enteros para evitar problemas de redondeo
3. **Descripciones claras:** Ayuda a los usuarios a entender qué están ordenando
4. **Modificadores lógicos:** Agrupa modificadores relacionados
5. **Validación de required:** Si un grupo es `required: true`, el usuario DEBE seleccionar una opción
6. **multiSelect:** Usa `false` para radio buttons, `true` para checkboxes

## Próximos Pasos

Para una solución más robusta en producción, considera:

1. Crear una API de administración de productos
2. Almacenar imágenes en S3 o CDN
3. Implementar validaciones de disponibilidad
4. Agregar inventario y stock
5. Crear categorías como entidades separadas
6. Implementar gestión de precios dinámicos
