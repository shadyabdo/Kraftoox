import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

/* بدون StrictMode عمداً: المحركات المدمجة الثقيلة لا تتحمل
   التركيب المزدوج في وضع التطوير وقد تعلق على شاشة بيضاء */
createRoot(document.getElementById("root")!).render(<App />);
