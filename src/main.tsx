import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { I18nProvider } from "./lib/i18n";

/* بدون StrictMode عمداً: المحركات المدمجة الثقيلة (CE.SDK) لا تتحمل
   التركيب المزدوج في وضع التطوير وقد تعلق على شاشة بيضاء */
createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
