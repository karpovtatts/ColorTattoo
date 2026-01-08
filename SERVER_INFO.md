# 📋 Памятка по деплою ColorTattoo

## 🖥️ Информация о сервере

- **IP**: 155.212.165.45
- **Домен**: 155-212-165-45.nip.io
- **Пользователь**: **webapp**
- **Путь на сервере**: `/home/webapp/projects/colortattoo`
- **URL**: `https://155-212-165-45.nip.io/colortattoo`

---

## 🚀 Деплой (первый раз)

### 1. Локально: Настройка base path

Создайте файл `.env.production` в корне проекта:

```env
VITE_BASE_PATH=/colortattoo/
```

### 2. Локально: Сборка

```powershell
npm run build
```

Создастся папка `dist/` с собранными файлами.

### 3. Загрузка dist через WinSCP

- Подключитесь к серверу: `webapp@155.212.165.45`
- Загрузите всю папку `dist/` в `/home/webapp/projects/colortattoo/`
- **Важно:** Загружайте содержимое `dist/`, а не саму папку `dist`

### 4. На сервере через Putty: Настройка nginx (один раз)

**⚠️ Про crm-appx:** Это старый/тестовый конфиг без SSL. Можно удалить, он не используется:
```bash
sudo rm /etc/nginx/sites-available/crm-appx
```

**Настройка nginx:**

```bash
# Подключитесь к серверу (можно как root или webapp)
ssh webapp@155.212.165.45
# или
ssh root@155.212.165.45

# Редактируем nginx конфиг (нужны права root, поэтому используем sudo)
sudo nano /etc/nginx/sites-available/crm-app
```

**Важно:** Для редактирования nginx конфига нужны права root (sudo), переключаться на webapp не нужно. Webapp нужен только для работы с файлами проекта.

Замените содержимое файла на полный корректный конфиг ниже (или добавьте блоки ColorTattoo перед `location /schedule {`):

**⚠️ ВАЖНО:** Копируйте только код между ```nginx и ```, БЕЗ самих этих строк! Это markdown разметка, не код nginx!

**Полный корректный nginx конфиг `/etc/nginx/sites-available/crm-app`:**

```nginx
server {
    server_name 155-212-165-45.nip.io;

    # ===== ColorTattoo Frontend =====
    location /colortattoo {
        alias /home/webapp/projects/colortattoo;
        index index.html;
        try_files $uri $uri/ /colortattoo/index.html;
        
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    # Кеширование статических ресурсов ColorTattoo
    location ~ ^/colortattoo/assets/.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        alias /home/webapp/projects/colortattoo;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ ^/colortattoo/.*\.(svg|ico|png|jpg|jpeg|gif|woff|woff2|ttf|eot)$ {
        alias /home/webapp/projects/colortattoo;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ===== CRM App (важное) =====
    location /schedule {
        proxy_pass http://localhost:8081/schedule;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # ===== Eatsite Backend WebSocket =====
    location /ws {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # ===== Eatsite Backend API =====
    location ~ ^/workspace {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        proxy_no_cache 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    location ~ ^/(products|recipes|categories|export|health|base-basket|stores|prices) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # ===== Eatsite Backend API через /eat =====
    location ^~ /eat/stores {
        rewrite ^/eat/(.*)$ /$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    location ^~ /eat/prices {
        rewrite ^/eat/(.*)$ /$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    location ~ ^/eat/(products|recipes|categories|export|health|base-basket|workspace) {
        rewrite ^/eat/(.*)$ /$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        proxy_no_cache 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    # ===== Eatsite Frontend =====
    location /eat {
        rewrite ^/eat$ / break;
        rewrite ^/eat/(.*)$ /$1 break;
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }
    
    location ~ ^/eat/(sw\.js|registerSW\.js|manifest\.webmanifest)$ {
        rewrite ^/eat/(.*)$ /$1 break;
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }
    
    location ~ ^/eat/assets/.*\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        rewrite ^/eat/(.*)$ /$1 break;
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Корневой путь для CRM (fallback для всех остальных запросов)
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/155-212-165-45.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/155-212-165-45.nip.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = 155-212-165-45.nip.io) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name 155-212-165-45.nip.io;
    return 404;
}
```

**Важно:** 
- **Порядок блоков (по приоритету):**
  1. `/colortattoo` (ColorTattoo)
  2. `/schedule` (CRM - важное)
  3. `/ws`, `/workspace`, `/eat` (Eatsite - пет-проект)
  4. `/` (CRM fallback - в самом конце)
- Технически `/schedule` будет работать и в конце, но для ясности и логики он размещен выше пет-проектов

Проверьте и перезагрузите:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo chown -R webapp:webapp /home/webapp/projects/colortattoo
sudo chmod -R 755 /home/webapp/projects/colortattoo
```

---

## 🔄 Обновление приложения

### 1. Локально: Сборка

```powershell
npm run build
```

### 2. Загрузка dist через WinSCP

Загрузите обновленную папку `dist/` в `/home/webapp/projects/colortattoo/` (замените старые файлы).

### 3. На сервере через Putty: Обновление через Git (опционально)

**Если git не настроен на сервере**, настройте его один раз:

```bash
ssh webapp@155.212.165.45
cd /home/webapp/projects/colortattoo

# Инициализируем git репозиторий
git init

# Добавляем remote (используйте ваш репозиторий)
git remote add origin https://github.com/karpovtatts/ColorTattoo.git
# или если используете SSH:
# git remote add origin git@github.com:karpovtatts/ColorTattoo.git

# Создаем ветку main
git branch -M main

# Настраиваем отслеживание удаленной ветки
git branch --set-upstream-to=origin/main main

# Первый раз: получаем файлы
# Если на сервере уже есть файлы (dist), используйте:
git pull origin main --allow-unrelated-histories

# Если файлов нет, просто:
# git pull origin main
```

**После настройки для обновления:**

```bash
ssh webapp@155.212.165.45
cd /home/webapp/projects/colortattoo
git pull origin main
```

**Готово!** Nginx уже настроен, перезагружать не нужно.

---

## ⚠️ Важно

- **Base path обязателен**: Без `VITE_BASE_PATH=/colortattoo/` в `.env.production` ничего не будет работать
- **Сборка только локально**: На сервере не запускайте `npm run build`
- **Работа от webapp**: Все команды выполняйте от пользователя `webapp`

---

## 🐛 Проблемы

### Ошибка 500 Internal Server Error

**Проверьте логи nginx:**
```bash
sudo tail -50 /var/log/nginx/error.log
```

**Частые причины:**
1. **Неправильный путь в alias** - проверьте, что путь `/home/webapp/projects/colortattoo` существует
2. **Нет файлов** - проверьте, что файлы загружены:
   ```bash
   ls -la /home/webapp/projects/colortattoo
   ```
3. **Неправильные права доступа:**
   ```bash
   sudo chown -R webapp:webapp /home/webapp/projects/colortattoo
   sudo chmod -R 755 /home/webapp/projects/colortattoo
   ```
4. **Ошибка в nginx конфиге** - проверьте синтаксис:
   ```bash
   sudo nginx -t
   ```

### Белый экран / 404

1. Проверьте, что в `dist/index.html` все пути начинаются с `/colortattoo/`
2. Если нет - пересоберите с `.env.production` с `VITE_BASE_PATH=/colortattoo/`

### 403 Forbidden

```bash
sudo chown -R webapp:webapp /home/webapp/projects/colortattoo
sudo chmod -R 755 /home/webapp/projects/colortattoo
```

### Статические файлы не загружаются

Проверьте конфигурацию nginx - должны быть блоки для статических файлов (см. выше).

---

## 📝 Полезные команды

```bash
# Проверить файлы на сервере
ls -la /home/webapp/projects/colortattoo

# Проверить nginx
sudo nginx -t
sudo systemctl reload nginx

# Логи nginx
sudo tail -f /var/log/nginx/error.log
```
