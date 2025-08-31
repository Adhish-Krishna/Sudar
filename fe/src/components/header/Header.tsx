import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="logo-text">Sudar</h1>
        </div>
        <div className="user-section">
          <div className="user-avatar">
            <img 
              src="https://placehold.co/40x40/7c3aed/ffffff?text=A" 
              alt="User Avatar" 
              className="avatar-image"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
