# cyberzatr1k

cyberzatr1k - экосистема для работы с дедлайнами. Содержит 2 основные части:
- Админ-панель
- Бот Telegram

## Начало работы

Для того, чтобы развернуть проект, требуется совершить следующие действия:

#### Внешние тома
Создать внешние тома:
- `lavinmq`
- `postgres`
- `caddy_data`
- `bot_data`

#### Файл среды .env
Требуется сконфигурировать файл среды:
- `BOT_TOKEN` - Telegram токен бота
- `API_TOKEN` - При первом запуске установите любое значение (токен генерируется далее внутри админ-панели)
- `STRAPI_APP_KEYS` - 4 ключа приложения в формате Base64
- `STRAPI_API_TOKEN_SALT` -  Соль для токена в формате Base64
- `STRAPI_ADMIN_JWT_SECRET` - Токен в формате Base64
- `STRAPI_TRANSFER_TOKEN_SALT` - Токен в формате Base64
- `STRAPI_JWT_SECRET` - Токен для JWT в формате Base64
- `PUBLIC_URL` - Адрес админ-панели
- `CHAT_ID` - ID чата для уведомлений в Telegram

#### Запуск Docker Compose
После этого запустите Docker Compose, используя конфигурацию /deploy/prod/docker-compose.yml.

#### Получение ключа
После завершения установки и сборки перейдите в админ панель по адресу `<PUBLIC_URL>/admin`. Вас встретит окно регистрации первого пользователя:

![Окно регистрации](https://sun9-64.userapi.com/impg/SzkDPpFc7ZP08eTeuBuweDOEk0QjSOJY6oEaJQ/9mLWQUwpAo0.jpg?size=2560x1358&quality=96&sign=f544bb575b5a21bd7ea802a0ef7ab6fb&type=album)

Зарегестрируйтесь, перейдите в Settings/API Tokens и создайте API Token (Full Access):

![Token](https://sun9-46.userapi.com/impg/-4bSlKFwhCxb6q2MtfL54jDAvxCgsZkI6CJxFw/TWZRCBvl5Kk.jpg?size=2560x1358&quality=96&sign=94072b9a415bf791cf3c27e7b7273354&type=album)

![Token creation](https://sun9-5.userapi.com/impg/-dDodVqQSUbIXUijW9om7UKIqCLDpXsngvz-vA/E2vIbsorkt0.jpg?size=2560x1358&quality=96&sign=704e93bf7433e815d2616e4d641ea13b&type=album)

После создания токена вставьте его в поле `API_TOKEN` в .env файле. Перезапустите проект. Все готово к работе.

Перейдите к вашему Telegram-боту и используйте команду `/remind`.



--- 
## Как пользоваться ботом

Для добавления новых дедлайнов откройте Админ-панель и перейдите в Content Manager. Отсюда можно добавлять новые дедлайны:

![Add](https://sun9-25.userapi.com/impg/k_a_T3OKpX40WbpzP7jLdz0v24GcBQCrt4Zlfw/z3hBfvwQiD8.jpg?size=2560x1358&quality=96&sign=99177ff89201f598befc5ce66fccdc1e&type=album)

После добавления дедлайна он появится в боте, и его можно будет просмотреть с помощью `/remind`. Также бот будет предупреждать о дедлайне за день и за час до его наступления.