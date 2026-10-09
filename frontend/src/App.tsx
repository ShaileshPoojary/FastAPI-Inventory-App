import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'

type Product = {
  id: number
  name: string
  description: string
  price: number
  quantity: number
}

type ProductFields = Omit<Product, 'id'>
type ProductCreate = Product
type SortField = keyof Product
type ApiErrorDetail = string | Array<{ loc?: Array<string | number>; msg: string }>

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const EMPTY_FORM = { id: '', name: '', description: '', price: '', quantity: '' }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new Error('Could not reach the API. Check that the backend is running.')
  }

  const body = await response.json().catch(() => null) as { detail?: ApiErrorDetail } | null
  if (!response.ok) {
    const detail = body?.detail
    const message = Array.isArray(detail)
      ? detail.map((item, index) => {
        const field = item.loc?.[item.loc.length - 1] ?? 'Input'
        return `${index + 1}. ${field}: ${item.msg}`
      }).join('\n')
      : typeof detail === 'string' ? detail : `Request failed (${response.status})`
    throw new Error(message)
  }

  return body as T
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchProducts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const data = await request<Product[]>('/products')
      setProducts(data)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to fetch products')
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    request<Product[]>('/products')
      .then((data) => {
        if (active) {
          setProducts(data)
          setError('')
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Failed to fetch products')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!message && !error) return
    const timer = window.setTimeout(() => {
      setMessage('')
      setError('')
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [message, error])

  const visibleProducts = useMemo(() => {
    const query = filter.trim().toLowerCase()
    return [...products]
      .filter((product) => !query || String(product.id).includes(query)
        || product.name.toLowerCase().includes(query)
        || product.description.toLowerCase().includes(query))
      .sort((left, right) => {
        const a = left[sortField]
        const b = right[sortField]
        const comparison = typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
        return sortDirection === 'asc' ? comparison : -comparison
      })
  }, [filter, products, sortDirection, sortField])

  const changeSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    const values: ProductFields = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    }
    try {
      if (editId !== null) {
        await request<Product>(`/products/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        })
        setMessage('Product updated successfully')
      } else {
        const product: ProductCreate = { id: Number(form.id), ...values }
        await request<Product>('/products', {
          method: 'POST',
          body: JSON.stringify(product),
        })
        setMessage('Product created successfully')
      }
      resetForm()
      await fetchProducts(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const editProduct = (product: Product) => {
    setForm({
      id: String(product.id),
      name: product.name,
      description: product.description,
      price: String(product.price),
      quantity: String(product.quantity),
    })
    setEditId(product.id)
    setMessage('')
    setError('')
  }

  const deleteProduct = async (id: number) => {
    if (!window.confirm('Delete this product?')) return
    setLoading(true)
    setMessage('')
    setError('')
    try {
      await request<{ detail: string }>(`/products/${id}`, { method: 'DELETE' })
      setMessage('Product deleted successfully')
      if (editId === id) resetForm()
      await fetchProducts(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const currency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">▦</span>
          <h1>Inventory App</h1>
        </div>
        <button className="button button-light" type="button" onClick={() => void fetchProducts()} disabled={loading}>
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">STOCK CONTROL</p>
            <h2>Product inventory</h2>
          </div>
          <div className="product-count"><strong>{products.length}</strong><span>products</span></div>
        </div>

        <div className="top-grid">
          <section className="panel form-panel">
            <h2>{editId !== null ? 'Edit product' : 'Add product'}</h2>
            <form className="product-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>ID</span>
                <input type="number" min="0" step="1" required disabled={editId !== null} value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
              </label>
              <label className="field">
                <span>Name</span>
                <input type="text" required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label className="field">
                <span>Description</span>
                <input type="text" required maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <label className="field">
                <span>Price</span>
                <input type="number" min="0" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
              </label>
              <label className="field">
                <span>Quantity</span>
                <input type="number" min="0" step="1" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
              </label>
              <div className="form-actions">
                <button className="button button-primary" type="submit" disabled={loading}>
                  {editId !== null ? 'Update product' : 'Add product'}
                </button>
                {editId !== null && <button className="button button-text" type="button" onClick={resetForm}>Cancel</button>}
              </div>
            </form>
            {message && <div className="notice notice-success" role="status">{message}</div>}
            {error && <div className="notice notice-error" role="alert">{error}</div>}
          </section>

          <aside className="tagline-panel">
            <span className="tagline-mark" aria-hidden="true">✦</span>
            <p className="eyebrow">A BETTER VIEW OF STOCK</p>
            <h2>Track.<br />Manage.<br /><em>Grow.</em></h2>
            <p className="tagline-copy">A clear place for every product in your catalogue.</p>
          </aside>
        </div>

        <section className="panel table-panel" aria-labelledby="products-title">
          <div className="table-heading">
            <div>
              <p className="eyebrow">YOUR CATALOGUE</p>
              <h2 id="products-title">Product list</h2>
            </div>
            <label className="search-box">
              <span className="sr-only">Search products</span>
              <input type="search" placeholder="Search by ID, name or description..." value={filter} onChange={(event) => setFilter(event.target.value)} />
            </label>
          </div>
          {loading && products.length === 0 ? (
            <div className="table-state">Loading products…</div>
          ) : visibleProducts.length === 0 ? (
            <div className="table-state">{filter ? 'No matching products.' : 'No products yet.'}</div>
          ) : (
            <div className="table-scroll">
              <table className="product-table">
                <thead><tr>
                  {(['id', 'name', 'description', 'price', 'quantity'] as SortField[]).map((field) => (
                    <th key={field} aria-sort={sortField === field ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                      <button type="button" className="sort-button" onClick={() => changeSort(field)}>
                        {field === 'price' ? 'Price' : field[0].toUpperCase() + field.slice(1)}
                        {sortField === field && <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>}
                      </button>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr></thead>
                <tbody>{visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className="name-cell">{product.name}</td>
                    <td className="description-cell" title={product.description}>{product.description}</td>
                    <td>{currency(product.price)}</td>
                    <td><span className="quantity-pill">{product.quantity}</span></td>
                    <td><div className="row-actions">
                      <button className="button button-small" type="button" onClick={() => editProduct(product)}>Edit</button>
                      <button className="button button-small button-danger" type="button" onClick={() => void deleteProduct(product.id)}>Delete</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {loading && products.length > 0 && <div className="refresh-line">Refreshing…</div>}
        </section>
      </main>
    </div>
  )
}

export default App
