import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://127.0.0.1:5000'

function App() {
  // Authentication state (persisted in localStorage)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fancy_user')
    return saved ? JSON.parse(saved) : null
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [authUsername, setAuthUsername] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Wishlist state
  const [wishlistData, setWishlistData] = useState(null)

  // New item form state
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('musts')

  // Function to fetch the wishlist for a given user ID
  const fetchWishlist = (userId) => {
    fetch(`${API_BASE}/users/${userId}/wishlist`)
      .then(res => res.json())
      .then(data => {
        setWishlistData(data)
      })
  }

  // Fetch data when a user is authenticated
  useEffect(() => {
    if (!user) return
    let active = true
    fetch(`${API_BASE}/users/${user.id}/wishlist`)
      .then(res => res.json())
      .then(data => {
        if (active) setWishlistData(data)
      })
    return () => {
      active = false
    }
  }, [user])

  // Handle Login or Register submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')

    const endpoint = isRegistering ? '/register' : '/login'
    const payload = isRegistering
      ? { username: authUsername, email: authEmail, password: authPassword }
      : { username: authUsername, password: authPassword }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed')
        return
      }

      // Save user and navigate to wishlist landing page
      localStorage.setItem('fancy_user', JSON.stringify(data.user))
      setWishlistData(null)
      setUser(data.user)
      setAuthUsername('')
      setAuthEmail('')
      setAuthPassword('')
    } catch {
      setAuthError('Could not connect to the backend server.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('fancy_user')
    setWishlistData(null)
    setUser(null)
  }

  // Handle adding a new wishlist item
  const handleAddItem = (e) => {
    e.preventDefault()

    const itemData = {
      user_id: user.id,
      title: newItemTitle,
      price: newItemPrice ? parseFloat(newItemPrice) : null,
      category: newItemCategory
    }

    fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    })
      .then(res => res.json())
      .then(() => {
        setNewItemTitle('')
        setNewItemPrice('')
        fetchWishlist(user.id)
      })
  }

  // ==========================================
  // VIEW 1: LOGIN / REGISTER SCREEN
  // ==========================================
  if (!user) {
    return (
      <div className="app-container" style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
        <h1>Fancy</h1>
        <h2>{isRegistering ? 'Create an Account' : 'Login'}</h2>

        {authError && (
          <p style={{ color: 'red' }}>{authError}</p>
        )}

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder={isRegistering ? 'Username' : 'Username or Email'}
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
            required
          />

          {isRegistering && (
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
          />

          <button type="submit">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '15px' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering)
              setAuthError('')
            }}
          >
            {isRegistering ? 'Login here' : 'Register here'}
          </button>
        </p>
      </div>
    )
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED WISHLIST LANDING PAGE
  // ==========================================
  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{user.username}'s Wishlist</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* THE ADD ITEM FORM */}
      <form onSubmit={handleAddItem} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Add a New Gift</h3>
        <input
          type="text"
          placeholder="Item Name (e.g. Mechanical Keyboard)"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={newItemPrice}
          onChange={(e) => setNewItemPrice(e.target.value)}
        />
        <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}>
          <option value="musts">Must Have</option>
          <option value="can't go wrong">Can't Go Wrong</option>
          <option value="i love">I Love (Hobbies)</option>
        </select>
        <button type="submit">Add to Wishlist</button>
      </form>

      {/* THE WISHLIST GRID */}
      {!wishlistData ? (
        <div>Loading wishlist...</div>
      ) : wishlistData.wishlist.length === 0 ? (
        <p>Your wishlist is empty. Add your first gift above!</p>
      ) : (
        <div className="wishlist-grid">
          {wishlistData.wishlist.map(item => (
            <div key={item.id} className="item-card" style={{ border: '1px solid blue', margin: '10px', padding: '10px' }}>
              <h3>{item.title}</h3>
              <p>Category: {item.category}</p>
              {item.price != null && <p>Price: ${item.price}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
