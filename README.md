# SurveyCraft

A full-stack survey and analytics platform that allows users to create dynamic forms, collect responses, and gain actionable insights through real-time analytics.

The application supports building customizable forms with multiple question types, including text, number, boolean, and single/multi-choice inputs. It features conditional logic, enabling dynamic question flows based on user responses.

On the backend, the system is built with Node.js and TypeScript, using a schema-driven approach for validation and data processing. Responses are stored in a flexible JSON format and validated dynamically based on the form structure.

The platform includes a comprehensive analytics module, providing both aggregated and detailed insights. Users can view overall form performance, analyze individual question statistics (such as distributions, averages, and counts), and explore time-based trends. Additionally, it supports viewing individual submissions, enabling a complete understanding of user input.

The frontend is designed as a dynamic UI that renders forms and analytics based on backend schemas, ensuring scalability and flexibility for future extensions.

This project demonstrates strong capabilities in building scalable APIs, handling dynamic data structures, implementing validation logic, and designing user-centric analytics systems similar to modern SaaS products like Typeform.

## Tech Stack

**Backend**
- Node.js + TypeScript
- Prisma ORM
- PostgreSQL
- BullMQ
- Redis (background job queues)
- JWT-based authentication

**Frontend**
- React

## Getting Started

```bash
git clone https://github.com/sanya-shch/SurveyCraft.git
cd SurveyCraft

# Start the backend:
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Start the frontend (in a separate terminal):
cd react-frontend
npm run dev
```

### Environment Variables

Create a `.env` file inside `backend/` with the following variables:

```dotenv
# PostgreSQL connection string, e.g. postgresql://user:password@localhost:5432/surveycraft
DATABASE_URL=

# Secret used to sign/verify JWT auth tokens
JWT_SECRET=

# Redis connection string, e.g. redis://localhost:6379
REDIS_URL=
```

## Screenshots

![dashboard](/assets/dashboardScreenshot.png)
![builder](/assets/builderScreenshot.png)
![public](/assets/publicScreenshot.png)
![dashboard2](/assets/dashboard2Screenshot.png)
![analytics](/assets/analyticsScreenshot.png)