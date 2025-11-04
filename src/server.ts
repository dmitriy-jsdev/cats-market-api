import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ALL_CATS, CATS_PAGE_SIZE } from "./data/cats";
import { findUserByUsername, createUser } from "./data/users";

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = [FRONTEND_ORIGIN, "http://localhost:5173"].filter(
  Boolean
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  "/images",
  express.static(path.join(__dirname, "..", "public", "images"))
);

app.get("/api/products", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || CATS_PAGE_SIZE;

  const totalPages = Math.max(1, Math.ceil(ALL_CATS.length / limit));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const start = (currentPage - 1) * limit;
  const end = start + limit;

  const products = ALL_CATS.slice(start, end);

  res.json({
    products,
    pages: totalPages,
  });
});

app.post("/api/sign_up", async (req, res) => {
  const { username, full_name, password } = req.body as {
    username?: string;
    full_name?: string;
    password?: string;
  };

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Имя пользователя и пароль обязательны" });
  }

  if (username.length < 3 || username.length > 30) {
    return res
      .status(400)
      .json({ message: "Имя пользователя должно быть от 3 до 30 символов" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Пароль должен быть не короче 8 символов" });
  }

  const existing = findUserByUsername(username);
  if (existing) {
    return res
      .status(409)
      .json({ message: "Пользователь с таким именем уже существует" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser(username, full_name || "", passwordHash);

  return res.status(200).json({
    id: user.id,
    username: user.username,
    full_name: user.fullName,
  });
});

app.post("/api/sign_in", async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Имя пользователя и пароль обязательны" });
  }

  const user = findUserByUsername(username);
  if (!user) {
    return res
      .status(401)
      .json({ message: "Неверное имя пользователя или пароль" });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res
      .status(401)
      .json({ message: "Неверное имя пользователя или пароль" });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      full_name: user.fullName,
    },
  });
});

app.get("/api/me", (req, res) => {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    return res.status(401).json({ message: "Не авторизован" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
    };

    const user = findUserByUsername(payload.username);
    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }

    return res.json({
      id: user.id,
      username: user.username,
      full_name: user.fullName,
    });
  } catch {
    return res.status(401).json({ message: "Не авторизован" });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
