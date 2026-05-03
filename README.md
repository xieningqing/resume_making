# ResumeMaking - 在线简历制作平台

一个基于 Markdown 的在线简历制作工具，用户可通过 Markdown 语法快速编写简历，实时预览排版效果，切换背景模板，上传个人头像，最终导出为 PNG/PDF 格式。

## 功能特性

### 用户端

- **Markdown 编辑器** — 支持富文本编辑与源码编辑双模式，实时双栏预览
- **简历头像** — 支持上传个人头像（jpg/png/gif/webp，最大 2MB），存储于阿里云 OSS
- **背景模板** — 多种简历背景模板可选，一键切换
- **导出功能** — 支持导出 PNG 和 PDF 格式，后端 Playwright 渲染保证样式一致
- **自动保存** — 编辑内容防抖自动保存，支持 Ctrl+S 手动保存
- **个人中心** — 修改昵称、修改密码（支持旧密码验证和邮箱验证码两种方式）
- **系统公告** — Dashboard 页面展示管理员发布的全局公告

### 管理端

- **用户管理** — 查看/搜索用户、启用/禁用账号、设置管理员权限、重置密码
- **简历管理** — 查看/搜索所有简历、删除简历
- **访问统计** — 最近 7 天接口访问量统计，按日分组展示
- **系统配置** — 验证码有效期、Token 有效期、自动保存间隔、系统公告

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 状态管理 | Zustand |
| 路由 | React Router v6 |
| Markdown 编辑器 | Tiptap |
| 构建工具 | Vite |
| 后端框架 | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 (async) |
| 数据校验 | Pydantic v2 |
| 数据库 | MySQL 8.x (aiomysql) |
| 认证 | JWT (python-jose + passlib/bcrypt) |
| 邮件 | aiosmtplib |
| 对象存储 | 阿里云 OSS (alibabacloud-oss-v2) |
| 导出渲染 | Playwright |

## 项目结构

```
resume_making/
├── frontend/                    # React 前端应用
│   ├── src/
│   │   ├── api/                 # API 请求封装 (client.ts, auth.ts, resume.ts, admin.ts)
│   │   ├── components/          # 通用 UI 组件 (Button, Input, Card, Modal, Toast)
│   │   ├── hooks/               # 自定义 Hooks (useAuth, useDebounce, usePagination)
│   │   ├── pages/               # 页面组件
│   │   │   ├── Auth/            # 登录 / 注册
│   │   │   ├── Dashboard/       # 简历管理列表
│   │   │   ├── Editor/          # 简历编辑器
│   │   │   ├── Profile/         # 个人中心
│   │   │   └── Admin/           # 后台管理
│   │   ├── stores/              # Zustand 状态管理 (auth, resume, ui)
│   │   ├── types/               # TypeScript 类型定义
│   │   └── utils/               # 工具函数
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # FastAPI 后端应用
│   ├── app/
│   │   ├── api/                 # 路由端点 (auth, resumes, templates, export, admin)
│   │   ├── core/                # 核心配置 (config, security, database, deps)
│   │   ├── middleware/          # 中间件 (access_log)
│   │   ├── models/              # SQLAlchemy 数据模型
│   │   ├── schemas/             # Pydantic 请求/响应 Schema
│   │   ├── services/            # 业务逻辑 (config, email, oss)
│   │   └── utils/               # 工具函数 (response)
│   ├── migrations/              # Alembic 数据库迁移
│   ├── main.py                  # 应用入口
│   ├── seed.py                  # 初始数据脚本
│   ├── requirements.txt
│   └── .env.example             # 环境变量模板
│
└── docs/                        # 项目文档
```

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- MySQL 8.x

### 1. 克隆项目

```bash
git clone <repository-url>
cd resume_making
```

### 2. 创建数据库

```sql
CREATE DATABASE resume_maker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置并启动后端

```bash
cd backend

# 创建环境变量文件
cp .env.example .env
# 编辑 .env，填入数据库连接、密钥、SMTP、OSS 等配置（见下方说明）

# 安装依赖
pip install -r requirements.txt

# 初始化数据（可选，会创建管理员账号）
python seed.py

# 启动开发服务器
uvicorn main:app --reload --port 8000
```

### 4. 配置并启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

前端通过 Vite proxy 将 `/resume-maker/v1` 请求转发到后端 `localhost:8000`，无需额外配置。

## 环境变量配置

复制 `backend/.env.example` 为 `backend/.env`，按需填写：

| 分类 | 变量 | 说明 | 示例 |
|------|------|------|------|
| 数据库 | `DATABASE_URL` | MySQL 连接字符串 | `mysql+aiomysql://root:pass@host:3306/resume_maker?charset=utf8mb4&auth_plugin=mysql_clear_password` |
| 安全 | `SECRET_KEY` | JWT 签名密钥，务必替换为随机值 | `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| 安全 | `ALGORITHM` | JWT 算法 | `HS256` |
| 安全 | `ACCESS_TOKEN_EXPIRE_HOURS` | Token 有效期（小时） | `24` |
| 安全 | `CODE_EXPIRE_MINUTES` | 邮箱验证码有效期（分钟） | `5` |
| 跨域 | `CORS_ORIGINS` | 允许的前端来源，逗号分隔 | `http://localhost:5173` |
| 邮件 | `SMTP_HOST` | SMTP 服务器地址 | `smtp.qq.com` |
| 邮件 | `SMTP_PORT` | SMTP 端口 | `465` |
| 邮件 | `SMTP_USER` | 发件人邮箱 | `your-email@qq.com` |
| 邮件 | `SMTP_PASSWORD` | 邮箱授权码（非登录密码） | - |
| 邮件 | `SMTP_FROM_NAME` | 邮件发件人名称 | `简历制作平台` |
| OSS | `OSS_ACCESS_KEY_ID` | 阿里云 AccessKey ID | - |
| OSS | `OSS_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret | - |
| OSS | `OSS_BUCKET_NAME` | OSS Bucket 名称 | `resume-maker` |
| OSS | `OSS_ENDPOINT` | OSS Endpoint（不含 https://） | `oss-cn-hangzhou.aliyuncs.com` |
| OSS | `OSS_PUBLIC_URL` | OSS 公网访问域名 | `https://resume-maker.oss-cn-hangzhou.aliyuncs.com` |

## 使用指南

### 注册与登录

1. 访问首页，点击「注册」
2. 输入邮箱，点击「发送验证码」，前往邮箱获取 6 位验证码
3. 填写验证码和密码（至少 8 位，包含字母和数字），完成注册
4. 注册成功后自动登录，跳转到 Dashboard

### 制作简历

1. 在 Dashboard 点击「新建简历」，输入标题
2. 进入编辑器页面：
   - **左侧**：Markdown 富文本编辑器（可切换源码模式）
   - **右侧**：实时预览，支持缩放
3. 点击预览区左上角可上传个人头像
4. 顶部工具栏可切换背景模板
5. 内容自动保存，也可按 `Ctrl+S` 手动保存
6. 点击「导出 PNG」或「导出 PDF」下载简历

### 个人中心

点击导航栏「个人中心」按钮：

- **修改昵称**：输入新昵称后点击「保存」
- **修改密码**：
  - 「我知道旧密码」：输入旧密码 + 新密码即可修改
  - 「忘记密码」：通过邮箱验证码验证身份后修改新密码

### 管理后台

管理员登录后，导航栏显示「后台管理」入口：

- **用户管理**：搜索用户、启用/禁用账号、设置/取消管理员、重置密码（重置为邮箱地址）、删除用户
- **简历管理**：按用户筛选简历、删除简历
- **访问统计**：查看最近 7 天各接口每日访问量
- **系统配置**：设置验证码有效期、Token 有效期、自动保存间隔、系统公告

## API 文档

启动后端后访问自动生成的 API 文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 认证接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/auth/send-code` | 发送邮箱验证码 | - |
| POST | `/auth/register` | 注册 | - |
| POST | `/auth/login` | 登录 | - |
| GET | `/auth/me` | 获取当前用户信息 | Bearer |
| PUT | `/auth/nickname` | 修改昵称 | Bearer |
| POST | `/auth/change-password` | 修改密码 | Bearer |
| GET | `/auth/announcement` | 获取系统公告 | - |

### 简历接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/resumes` | 简历列表（分页） | Bearer |
| POST | `/resumes` | 创建简历 | Bearer |
| GET | `/resumes/:id` | 获取简历详情 | Bearer |
| PUT | `/resumes/:id` | 更新简历 | Bearer |
| DELETE | `/resumes/:id` | 删除简历 | Bearer |
| POST | `/resumes/:id/avatar` | 上传简历头像 | Bearer |
| DELETE | `/resumes/:id/avatar` | 删除简历头像 | Bearer |

### 其他接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/templates` | 模板列表 | - |
| POST | `/export/png` | 导出 PNG | Bearer |
| POST | `/export/pdf` | 导出 PDF | Bearer |

### 管理接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/admin/users` | 用户列表（分页/搜索） | Admin |
| PUT | `/admin/users/:id` | 更新用户状态/角色 | Admin |
| DELETE | `/admin/users/:id` | 删除用户 | Admin |
| POST | `/admin/users/:id/reset-password` | 重置用户密码 | Admin |
| GET | `/admin/resumes` | 简历列表（分页/筛选） | Admin |
| DELETE | `/admin/resumes/:id` | 删除简历 | Admin |
| GET | `/admin/stats` | 访问统计数据 | Admin |
| GET | `/admin/config` | 获取系统配置 | Admin |
| PUT | `/admin/config` | 更新系统配置 | Admin |

> 所有接口统一响应格式：`{ "code": 0, "message": "success", "data": {} }`

## 默认账号

运行 `python seed.py` 后会创建管理员账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | `admin@example.com` | `admin123456` |

**请在生产环境立即修改密码！**

## 常用命令

### 后端

```bash
uvicorn main:app --reload --port 8000   # 启动开发服务器
python seed.py                           # 初始化管理员账号
pytest                                   # 运行测试
```

### 前端

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run lint     # 代码检查
npm run test     # 运行测试
```

## License

MIT
