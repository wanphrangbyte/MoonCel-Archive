# MoonCel Archive

MoonCel Archive is a Fate-inspired full-stack e-commerce web application that combines online shopping with a unique gacha-based discount system. Upon login, users are randomly assigned a Fate Servant, and each Servant grants a unique store-wide discount that is automatically applied to eligible purchases, creating a personalized shopping experience.

---

## Features

- Fate-inspired Servant Gacha System
- Randomized store-wide discount system
- User registration and authentication
- Secure JWT-based authentication
- Shopping cart and checkout
- Razorpay payment integration
- Admin dashboard
- Product management (CRUD)
- Live product image uploads using Multer
- Password recovery and email notifications using NodeMailer
- Responsive user interface
- MySQL database integration
- Inventory management

---

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Libraries & Technologies

- JWT
- Multer
- NodeMailer
- Razorpay API
- dotenv

---

## Project Structure

```text
MoonCel-Archive
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── routes
│   ├── uploads
│   ├── utils
│   ├── server.js
│   ├── package.json
│   └── .gitignore
│
├── frontend
│   └── pages
│       ├── assets
│       ├── css
│       ├── html
│       └── js
│
├── screenshots
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/wanphrangbyte/MoonCel-Archive.git
```

### Navigate to the backend

```bash
cd MoonCel-Archive/backend
```

### Install dependencies

```bash
npm install
```

### Create a `.env` file

```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_SECRET=

EMAIL=
EMAIL_PASSWORD=
```

### Start the development server

```bash
npm run dev
```

---

## Screenshots

### Home Page

![Home Page](/screenshots/home%20page%201.png)

### register page

![register page](/screenshots/register%20page%20.png)

### Servant Summoning System

![Servant Summon](/screenshots/discount%20system%20example%20.png)

### Product Catalog

![Product Catalog](/screenshots/product%20page%201.png)
![Product Catalog](/screenshots/product%20pge%202.png)
![Product Catalog](/screenshots/product%20page%203.png)
![Product Catalog](/screenshots/product%20page%204.png)

### Shopping Cart

![Shopping Cart](/screenshots/checkout.png)

### Checkout

![Checkout](/screenshots/checkout.png)

### Admin Dashboard

![Admin Dashboard](/screenshots/admin%20page%201.png)
![Admin Dashboard](/screenshots/admin%20page%202.png)
![Admin Dashboard](/screenshots/admin%20page%203.png)

---

## Future Enhancements

- AI-powered product recommendations
- Wishlist functionality
- Product reviews and ratings
- Loyalty and rewards system
- Order tracking
- Sales analytics dashboard
- Multi-language support

---

## Inspiration

MoonCel Archive is inspired by the **Fate** series. Instead of using a traditional discount system, users summon a random Servant upon login. Each Servant grants a unique store-wide discount that is automatically applied to eligible purchases, introducing gacha mechanics into a complete e-commerce experience.

---

## Author

**Wanphrang Kma Pakem**

GitHub: https://github.com/wanphrangbyte