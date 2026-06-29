from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal
from app.models import Request, RequestPriority, RequestStatus, User, UserRole

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_EMAIL = "admin@example.com"
DEFAULT_ADMIN_PASSWORD = "admin"

SAMPLE_REQUESTS: list[dict] = [
    {
        "title": "Не работает принтер на 3 этаже",
        "description": "При печати документов выдаёт ошибку «Paper jam». Перезагрузка не помогла.",
        "status": RequestStatus.new,
        "priority": RequestPriority.high,
        "days_ago": 1,
    },
    {
        "title": "Запрос доступа к CRM",
        "description": "Нужен доступ для отдела продаж, новый сотрудник Иванов А.",
        "status": RequestStatus.in_progress,
        "priority": RequestPriority.normal,
        "days_ago": 3,
    },
    {
        "title": "Обновить антивирус на рабочих станциях",
        "description": "Плановое обновление Kaspersky в бухгалтерии до конца недели.",
        "status": RequestStatus.new,
        "priority": RequestPriority.normal,
        "days_ago": 0,
    },
    {
        "title": "Замена клавиатуры",
        "description": "Залили кофе, несколько клавиш не реагируют. Стол 12, open space.",
        "status": RequestStatus.done,
        "priority": RequestPriority.low,
        "days_ago": 14,
    },
    {
        "title": "Настроить VPN для удалённой работы",
        "description": "Сотрудник уезжает в командировку на 2 недели, нужен стабильный доступ к внутренней сети.",
        "status": RequestStatus.in_progress,
        "priority": RequestPriority.high,
        "days_ago": 2,
    },
    {
        "title": "Закупка мониторов",
        "description": "Заявка на 5 мониторов 27\" для дизайн-отдела. Бюджет согласован.",
        "status": RequestStatus.new,
        "priority": RequestPriority.normal,
        "days_ago": 4,
    },
    {
        "title": "Ошибка входа в корпоративную почту",
        "description": "После смены пароля Outlook пишет «не удаётся подключиться к серверу».",
        "status": RequestStatus.done,
        "priority": RequestPriority.high,
        "days_ago": 7,
    },
    {
        "title": "Установка Microsoft Teams",
        "description": "На новом ноутбуке нет Teams, нужна помощь с установкой и входом.",
        "status": RequestStatus.done,
        "priority": RequestPriority.low,
        "days_ago": 10,
    },
    {
        "title": "Медленный интернет в переговорной №2",
        "description": "Во время видеозвонков постоянно обрывается связь. Проблема наблюдается 3 дня.",
        "status": RequestStatus.in_progress,
        "priority": RequestPriority.high,
        "days_ago": 3,
    },
    {
        "title": "Создать учётную запись для стажёра",
        "description": "Стажёр Петрова М. выходит 1 июля, нужны AD, почта и доступ к Confluence.",
        "status": RequestStatus.new,
        "priority": RequestPriority.normal,
        "days_ago": 1,
    },
    {
        "title": "Резервное копирование файлового сервера",
        "description": "Проверить, что бэкап за прошлую ночь прошёл успешно. Есть подозрение на сбой.",
        "status": RequestStatus.in_progress,
        "priority": RequestPriority.high,
        "days_ago": 0,
    },
    {
        "title": "Замена картриджа в принтере HR",
        "description": "Закончился чёрный тонер, нужна замена или заказ расходников.",
        "status": RequestStatus.done,
        "priority": RequestPriority.low,
        "days_ago": 5,
    },
    {
        "title": "Настройка двухфакторной аутентификации",
        "description": "Помочь подключить 2FA для GitLab и корпоративного портала.",
        "status": RequestStatus.new,
        "priority": RequestPriority.normal,
        "days_ago": 2,
    },
    {
        "title": "Восстановить удалённые файлы",
        "description": "Случайно удалили папку с отчётами за Q1. Нужно восстановить с бэкапа.",
        "status": RequestStatus.in_progress,
        "priority": RequestPriority.high,
        "days_ago": 1,
    },
    {
        "title": "Обновление лицензий Office 365",
        "description": "Истекают лицензии у 3 пользователей, требуется продление.",
        "status": RequestStatus.new,
        "priority": RequestPriority.normal,
        "days_ago": 6,
    },
    {
        "title": "Не работает проектор в зале переговоров",
        "description": "Проектор не включается, индикатор мигает красным.",
        "status": RequestStatus.done,
        "priority": RequestPriority.normal,
        "days_ago": 12,
    },
    {
        "title": "Перенос рабочего места",
        "description": "Переезд сотрудника на другой этаж: перенести ПК, монитор и настроить сеть.",
        "status": RequestStatus.new,
        "priority": RequestPriority.low,
        "days_ago": 3,
    },
    {
        "title": "Ошибка 500 на внутреннем портале",
        "description": "При открытии раздела «Отпуска» сервер возвращает Internal Server Error.",
        "status": RequestStatus.in_progress,
        "priority": RequestPriority.high,
        "days_ago": 0,
    },
    {
        "title": "Запрос нового ноутбука",
        "description": "Текущий ноутбук не тянет Figma, нужна замена по политике обновления техники.",
        "status": RequestStatus.new,
        "priority": RequestPriority.normal,
        "days_ago": 8,
    },
    {
        "title": "Настройка доступа к тестовому стенду",
        "description": "Разработчику нужен VPN и SSH-доступ к staging-серверу для отладки.",
        "status": RequestStatus.done,
        "priority": RequestPriority.normal,
        "days_ago": 20,
    },
]

DEMO_USERS: list[dict] = [
    {"username": "ivan_petrov", "email": "ivan.petrov@company.com", "password": "user123"},
    {"username": "maria_sokol", "email": "maria.sokol@company.com", "password": "user123"},
    {"username": "alex_kuznet", "email": "alex.kuznet@company.com", "password": "user123"},
]


def seed_default_admin(db: Session) -> None:
    admin = db.query(User).filter(User.username == DEFAULT_ADMIN_USERNAME).first()
    if admin is None:
        db.add(
            User(
                username=DEFAULT_ADMIN_USERNAME,
                email=DEFAULT_ADMIN_EMAIL,
                hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
                role=UserRole.admin,
            )
        )


def seed_demo_users(db: Session) -> None:
    for item in DEMO_USERS:
        exists = db.query(User).filter(User.username == item["username"]).first()
        if exists is None:
            db.add(
                User(
                    username=item["username"],
                    email=item["email"],
                    hashed_password=hash_password(item["password"]),
                    role=UserRole.user,
                )
            )


def reset_and_seed_requests(db: Session) -> int:
    db.query(Request).delete()
    db.commit()

    now = datetime.now(timezone.utc)
    for item in SAMPLE_REQUESTS:
        created = now - timedelta(days=item["days_ago"], hours=item["days_ago"] * 2)
        updated = created + timedelta(hours=4) if item["status"] != RequestStatus.new else created
        db.add(
            Request(
                title=item["title"],
                description=item["description"],
                status=item["status"],
                priority=item["priority"],
                created_at=created,
                updated_at=updated,
            )
        )

    db.commit()
    return len(SAMPLE_REQUESTS)


def seed_default_admin_standalone() -> None:
    db = SessionLocal()
    try:
        seed_default_admin(db)
        db.commit()
    finally:
        db.close()


def reset_and_seed_all() -> None:
    db = SessionLocal()
    try:
        seed_default_admin(db)
        seed_demo_users(db)
        count = reset_and_seed_requests(db)
        print(f"Готово: добавлено {count} демо-заявок, admin и тестовые пользователи сохранены.")
    finally:
        db.close()


if __name__ == "__main__":
    reset_and_seed_all()
