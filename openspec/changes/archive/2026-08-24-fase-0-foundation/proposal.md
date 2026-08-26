# Fase 0 - Foundation

## Propuesta

Establecer la base técnica del proyecto KindStyle: monorepo con Next.js, TypeScript, PostgreSQL, Redis y Docker.

## Objetivos

- Configurar monorepo con workspaces (apps/web, packages/database, packages/shared, workers)
- Establecer TypeScript strict mode
- Configurar PostgreSQL con Prisma ORM
- Configurar Redis para cache y queues
- Configurar Docker Compose para desarrollo local
- Establecer convenciones de código (ESLint, Prettier)
- Configurar estructura de carpetas según convenciones

## Alcance

### In-scope
- Instalación de dependencias base
- Configuración de TypeScript
- Schema de Prisma con todos los modelos (según specs)
- Docker Compose (PostgreSQL + Redis)
- Variables de entorno (.env.example)
- Scripts npm para desarrollo
- Estructura de carpetas placeholder

### Non-goals
- Implementar lógica de negocio
- Crear componentes UI
- Configurar CI/CD
- Deploy a producción
- Testing de integración (solo setup básico de Vitest)

## Criterios de éxito

1. `npm install` completa sin errores
2. `docker-compose up -d` levanta PostgreSQL y Redis
3. `npm run db:generate` genera cliente Prisma
4. `npm run db:migrate` crea tablas en base de datos
5. `npm run dev` inicia servidor Next.js en localhost:3000
6. `npm run dev:worker` inicia workers
7. `npm run typecheck` pasa sin errores
8. `npm run lint` pasa sin errores

## Dependencias

- Node.js 20+
- Docker y Docker Compose
- PostgreSQL 15+
- Redis 7+

## Estimación

- **Duración**: 2-3 horas
- **Complejidad**: Baja
- **Riesgo**: Bajo

## Notas

Esta fase NO implementa funcionalidad. Solo establece la infraestructura para que las fases siguientes puedan construir sobre una base sólida.
