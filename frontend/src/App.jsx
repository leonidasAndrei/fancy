import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://127.0.0.1:5000'

const CATEGORY_META = {
  musts: { label: 'Must Have', icon: '✨', badgeClass: 'badge-musts' },
  "can't go wrong": { label: "Can't Go Wrong", icon: '🎁', badgeClass: 'badge-safe' },
  'i love': { label: 'I Love (Hobbies)', icon: '💜', badgeClass: 'badge-love' }
}

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

  // Wishlist & Filter state
  const [wishlistData, setWishlistData] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // New item form state
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('musts')
  const [newItemUrl, setNewItemUrl] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')

  // Fetch wishlist helper
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
      category: newItemCategory,
      url: newItemUrl.trim(),
      description: newItemDescription.trim()
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
        setNewItemUrl('')
        setNewItemDescription('')
        fetchWishlist(user.id)
      })
  }

  const items = wishlistData?.wishlist || []
  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter(item => item.category === selectedCategory)

  const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <>
      {/* TOP NAVIGATION BAR */}
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="brand">
            <div className="brand-mark">F</div>
            <span className="brand-name">fancy</span>
          </div>

          {user && (
            <div className="nav-controls">
              <div className="user-pill">
                <div className="user-avatar">{user.username.charAt(0)}</div>
                <span>@{user.username}</span>
              </div>
              <button type="button" className="icon-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ==========================================
          VIEW 1: LOGIN / REGISTER SCREEN
         ========================================== */}
      {!user ? (
        <main className="auth-wrapper">
          <div className="auth-ambient" />
          <div className="auth-card">
            <div className="auth-header">
              <h1>{isRegistering ? 'Join Fancy' : 'Welcome back'}</h1>
              <p>
                {isRegistering
                  ? 'Create an account to let everyone know what you fancy.'
                  : 'Sign in and discover what everyone fancies.'}
              </p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${!isRegistering ? 'active' : ''}`}
                onClick={() => {
                  setIsRegistering(false)
                  setAuthError('')
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${isRegistering ? 'active' : ''}`}
                onClick={() => {
                  setIsRegistering(true)
                  setAuthError('')
                }}
              >
                Create Account
              </button>
            </div>

            {authError && <div className="auth-error">{authError}</div>}

            <form onSubmit={handleAuthSubmit} className="form-stack">
              <div className="field-group">
                <label className="field-label">
                  {isRegistering ? 'Username' : 'Username or Email'}
                </label>
                <input
                  className="input-control"
                  type="text"
                  placeholder={isRegistering ? 'Enter a username' : 'Enter username or email'}
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                />
              </div>

              {isRegistering && (
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input
                    className="input-control"
                    type="email"
                    placeholder="you@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="field-group">
                <label className="field-label">Password</label>
                <input
                  className="input-control"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
                {isRegistering ? 'Discover what I fancy!' : 'Sign In'}
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* ==========================================
           VIEW 2: AUTHENTICATED FANCIES LANDING PAGE
           ========================================== */
        <main className="dashboard-container">
          {/* Hero Summary Banner */}
          <section className="wishlist-hero">
            <div className="hero-title-group">
              <h1>{user.username}’s Fancies</h1>
              <p className="hero-subtitle">
                Everything you fancy in one place, ready to share with friends.
              </p>
            </div>

            <div className="hero-stats">
              <div className="stat-chip">
                <span className="stat-value">{items.length}</span>
                <span className="stat-label">Total Fancies</span>
              </div>
              <div className="stat-chip">
                <span className="stat-value">${totalValue.toFixed(2)}</span>
                <span className="stat-label">Fancies Value</span>
              </div>
            </div>
          </section>

          <div className="dashboard-layout">
            {/* LEFT COLUMN: Add New Fancy Form */}
            <aside className="composer-card">
              <h3>Add a New Fancy</h3>
              <p className="composer-hint">Drop an item onto your board for friends to see.</p>

              <form onSubmit={handleAddItem} className="form-stack">
                <div className="field-group">
                  <label className="field-label">Item Name *</label>
                  <input
                    className="input-control"
                    type="text"
                    placeholder="e.g. Espresso Machine"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="field-group">
                    <label className="field-label">Price ($)</label>
                    <input
                      className="input-control"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="49.99"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Vibe / Category</label>
                    <select
                      className="input-control"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                    >
                      <option value="musts">✨ Must Have</option>
                      <option value="can't go wrong">🎁 Can't Go Wrong</option>
                      <option value="i love">💜 I Love</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Product Link (optional)</label>
                  <input
                    className="input-control"
                    type="url"
                    placeholder="https://..."
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Notes (size, color, edition)</label>
                  <input
                    className="input-control"
                    type="text"
                    placeholder="e.g. Matte black, size M"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary">
                  I fancy this!
                </button>
              </form>
            </aside>

            {/* RIGHT COLUMN: Filter Bar & Fancies Grid */}
            <section>
              <div className="filter-bar">
                <div className="category-pills">
                  <button
                    type="button"
                    className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All ({items.length})
                  </button>
                  <button
                    type="button"
                    className={`category-pill ${selectedCategory === 'musts' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('musts')}
                  >
                    ✨ Must Have
                  </button>
                  <button
                    type="button"
                    className={`category-pill ${selectedCategory === "can't go wrong" ? 'active' : ''}`}
                    onClick={() => setSelectedCategory("can't go wrong")}
                  >
                    🎁 Can’t Go Wrong
                  </button>
                  <button
                    type="button"
                    className={`category-pill ${selectedCategory === 'i love' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('i love')}
                  >
                    💜 I Love
                  </button>
                </div>
              </div>

              {!wishlistData ? (
                <div className="empty-state">
                  <p>Recovering the things you fancy...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎁</div>
                  <h3>No fancies here yet</h3>
                  <p>
                    {selectedCategory === 'all'
                      ? 'Use the form on the left to add the very first thing you fancy!'
                      : 'No fancies in this category yet. Try switching filters or adding a new one.'}
                  </p>
                </div>
              ) : (
                <div className="wishlist-grid">
                  {filteredItems.map((item, idx) => {
                    const meta = CATEGORY_META[item.category] || CATEGORY_META.musts
                    return (
                      <article
                        key={item.id}
                        className="item-card"
                        style={{ animationDelay: `${idx * 45}ms` }}
                      >
                        <div>
                          <div className="item-card-top">
                            <span className={`badge ${meta.badgeClass}`}>
                              <span>{meta.icon}</span>
                              <span>{meta.label}</span>
                            </span>
                            {item.price != null && (
                              <span className="item-price-tag">
                                ${Number(item.price).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <h3 className="item-title">{item.title}</h3>

                          {item.description && (
                            <p className="item-description">{item.description}</p>
                          )}
                        </div>

                        <div className="item-card-footer">
                          <span className="item-status">
                            {item.is_purchased ? '🎉 Claimed' : '🟢 Available'}
                          </span>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="item-link"
                            >
                              View Link ↗
                            </a>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </>
  )
}

export default App
