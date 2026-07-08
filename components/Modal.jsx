export default function Modal({ children, isOpen, kicker, title, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <p className="modal-kicker">{kicker}</p>
            <h2>{title}</h2>
          </div>

          <button className="close-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
