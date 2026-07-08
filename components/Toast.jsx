import { useEffect } from "react";

export default function Toast({ message, onHide }) {
  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(onHide, 3500);
    return () => window.clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;

  return <div className="toast">{message}</div>;
}
