DROP DATABASE IF EXISTS tp_final_crud;
CREATE DATABASE tp_final_crud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tp_final_crud;

-- TABLA: productos
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fechamodificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLA: clientes
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telefono VARCHAR(40),
  direccion VARCHAR(255),
  fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLA: pedidos (cabecera)
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clienteid INT NOT NULL,
  fechapedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('PENDIENTE','CONFIRMADO','ENVIADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observaciones TEXT,
  fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clienteid) REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLA: pedido_detalles (líneas del pedido)
CREATE TABLE pedidos_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedidoid INT NOT NULL,
  productoid INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  preciounitario DECIMAL(10,2) NOT NULL,
  totallinea DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (pedidoid) REFERENCES pedidos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (productoid) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLA: roles (para el usuario)
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLA: usuarios (cuentas de acceso)
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  passwordhash VARCHAR(255) NOT NULL,
  rolid INT NOT NULL,
  clienteid INT DEFAULT NULL,
  fechanacimiento DATE NULL,
  telefono VARCHAR(40) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimologin DATETIME NULL,
  FOREIGN KEY (rolid) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (clienteid) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INDICES
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_pedidos_cliente ON pedidos(clienteid);
CREATE INDEX idx_detalle_pedidos ON pedidos_detalle(pedidoid);

-- TRIGGERS 
DELIMITER $$
CREATE TRIGGER trg_detalle_before_insert
BEFORE INSERT ON pedidos_detalle
FOR EACH ROW
BEGIN
  SET NEW.totallinea = NEW.cantidad * NEW.preciounitario;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_pedido_after_insert
AFTER INSERT ON pedidos_detalle
FOR EACH ROW
BEGIN
  UPDATE pedidos
  SET total = (SELECT COALESCE(SUM(totallinea),0) FROM pedidos_detalle WHERE pedidoid = NEW.pedidoid)
  WHERE id = NEW.pedidoid;
END$$

CREATE TRIGGER trg_pedido_after_delete
AFTER DELETE ON pedidos_detalle
FOR EACH ROW
BEGIN
  UPDATE pedidos
  SET total = (SELECT COALESCE(SUM(totallinea),0) FROM pedidos_detalle WHERE pedidoid = OLD.pedidoid)
  WHERE id = OLD.pedidoid;
END$$

CREATE TRIGGER trg_pedido_after_update
AFTER UPDATE ON pedidos_detalle
FOR EACH ROW
BEGIN
  IF NEW.pedidoid = OLD.pedidoid THEN
      UPDATE pedidos
      SET total = (SELECT COALESCE(SUM(totallinea),0) FROM pedidos_detalle WHERE pedidoid = NEW.pedidoid)
      WHERE id = NEW.pedidoid;
  ELSE
      UPDATE pedidos
      SET total = (SELECT COALESCE(SUM(totallinea),0) FROM pedidos_detalle WHERE pedidoid = NEW.pedidoid)
      WHERE id = NEW.pedidoid;

      UPDATE pedidos
      SET total = (SELECT COALESCE(SUM(totallinea),0) FROM pedidos_detalle WHERE pedidoid = OLD.pedidoid)
      WHERE id = OLD.pedidoid;
  END IF;
END$$
DELIMITER ;

-- INSERTS
INSERT INTO productos (codigo, nombre, descripcion, precio, stock) VALUES
('P-1000','Camiseta deportiva','Camiseta de algodón, talle M', 2499.00, 20),
('P-1001','Auriculares USB','Auriculares con micrófono', 7999.50, 10),
('P-1002','Mouse óptico','Mouse USB con sensores 1600dpi', 2499.00, 15);

INSERT INTO clientes (dni, nombre, apellido, email, telefono, direccion) VALUES
('30111222','Juan','Perez','juan.perez@mail.com','+54 9 11 1234 5678','Av. Pueyrredon 1234'),
('28999888','Maria','Gomez','maria.gomez@mail.com','+54 9 11 9876 5432','Av. Cabildo 1111');

INSERT INTO pedidos (clienteid, fechapedido, estado, observaciones) VALUES (1, NOW(), 'PENDIENTE', 'Pedido de prueba');
SET @pedidoid = LAST_INSERT_ID();
INSERT INTO pedidos_detalle (pedidoid, productoid, cantidad, preciounitario) VALUES
(@pedidoid, 1, 2, 2499.00),
(@pedidoid, 3, 1, 2499.00);

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema'),
('USER',  'Usuario comun');

-- UPDATES
UPDATE pedidos p
JOIN (
  SELECT pedidoid, COALESCE(SUM(totallinea),0) AS total
  FROM pedidos_detalle
  GROUP BY pedidoid
) d ON d.pedidoid = p.id
SET p.total = d.total;

-- NOTA: En usuarios solo hacer INSERTS desde la API, ya que realiza un HASH para la contraseña
