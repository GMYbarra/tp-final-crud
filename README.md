# TP Final – CRUD con API y Base de Datos
Alumno: Gonzalo Ybarra – 2025

## 📌 Descripción
Proyecto CRUD compuesto por:
- API REST en .NET 8
- Base de datos MySQL
- Frontend en HTML + Bootstrap + JavaScript

Incluye gestión de productos, clientes, usuarios y pedidos (con detalle y estados).

## 📂 Estructura
src/
  api/        → Código backend
  frontend/   → Sitio web
dbf/
  schema.sql  → Script de BD
dist/         → (vacío)

## 🗄️ Base de datos
Ejecutar:
SOURCE dbf/schema.sql;

## 🚀 Ejecutar API
cd src/api/TpFinalApi
dotnet run

Swagger: http://localhost:5105/swagger

## 🌐 Ejecutar Frontend
Abrir:
src/frontend/index.html

## 🔌 Endpoints principales
Productos: GET/POST/PUT/DELETE  
Clientes: GET/POST/PUT/DELETE  
Pedidos: GET / POST / GET{id} / PUT{id}/estado  

Estados: PENDIENTE, CONFIRMADO, ENVIADO, CANCELADO

## ✔️ Funcionalidades
CRUD de productos y clientes  
Listado y detalle de pedidos  
Cambio de estado  
Creación de pedidos con ítems e impacto en stock

## 📎 Estado
Cumple todos los requisitos del TP: CRUD + API + BD + Frontend.

## Mejoras para una futura versión
CRUD de usuarios para el perfil de Administrador.
Utilización de CRUDs según el perfil del usuario.
Posibilidad de migrar el proyecto a Angular, con un objetivo más escalable.
Pantalla de Login del usuario.
Resgistro de usuario (ya sea para cliente o usuario admin, en caso de ser cliente, desarrollar algún tipo de autorización)