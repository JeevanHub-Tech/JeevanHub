import React, { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../../utils/authFetch';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import './MyItems.css';

function MyItems() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Edit Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', price: '', quantity: '', category: '', prescription: false, isActive: true
  });

  const fetchMyItems = async () => {
    try {
      const response = await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/medicines/my`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (response.ok) setItems(data);
      else setError(data.message || 'Failed to fetch items');
    } catch (error) {
      setError('An error occurred while fetching items');
    }
  };

  useEffect(() => { fetchMyItems(); }, []);

  // Derived State
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = item.isActive !== false;
      if (statusFilter === 'inactive') matchesStatus = item.isActive === false;
      if (statusFilter === 'in-stock') matchesStatus = item.quantity > 0;
      if (statusFilter === 'out-of-stock') matchesStatus = item.quantity === 0;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const categories = [...new Set(items.map(i => i.category))];

  // Actions
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredItems.map(i => i._id)));
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const response = await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/medicines/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (response.ok) fetchMyItems();
    } catch (error) { console.error("Toggle error", error); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/medicines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) fetchMyItems();
    } catch (error) { console.error("Delete error", error); }
  };

  const handleBulkAction = async (action) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete ${ids.length} items?`)) return;
        await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/medicines/bulk-delete`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        });
      } else {
        const isActive = action === 'activate';
        await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/medicines/bulk-status`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, isActive })
        });
      }
      setSelectedIds(new Set());
      fetchMyItems();
    } catch (err) { console.error(err); }
  };

  const openEditDrawer = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name, price: item.price, quantity: item.quantity, 
      category: item.category, prescription: item.prescription, isActive: item.isActive !== false
    });
    setIsDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/medicines/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        setIsDrawerOpen(false);
        fetchMyItems();
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="my-items-container">
      <div className="my-items-header">
        <h2 className="my-items-title">My Items</h2>
        <div className="my-items-actions">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search products by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          
          <button className="add-btn" onClick={() => window.location.href='/manage-products/add'}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-actions-text">{selectedIds.size} items selected</span>
          <div className="bulk-actions-buttons">
            <button className="bulk-btn activate" onClick={() => handleBulkAction('activate')}>Set Active</button>
            <button className="bulk-btn deactivate" onClick={() => handleBulkAction('deactivate')}>Set Inactive</button>
            <button className="bulk-btn delete" onClick={() => handleBulkAction('delete')}>Delete</button>
          </div>
        </div>
      )}

      <div className="table-container">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="col-image">Image</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const isSelected = selectedIds.has(item._id);
                const isActive = item.isActive !== false;
                const stockBadgeClass = item.quantity > 10 ? 'badge-stock-healthy' : (item.quantity > 0 ? 'badge-stock-low' : 'badge-stock-out');
                
                return (
                  <tr key={item._id} style={{ backgroundColor: isSelected ? '#f8fafc' : 'transparent' }}>
                    <td className="col-checkbox">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(item._id)} />
                    </td>
                    <td className="col-image">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0].startsWith('http') ? item.images[0] : `${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/${item.images[0].replace(/\\/g, '/')}`} 
                          alt={item.name} 
                          className="product-thumbnail"
                        />
                      ) : (
                        <div className="product-thumbnail" style={{backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>No Img</div>
                      )}
                    </td>
                    <td>
                      <div className="product-info">
                        <span className="product-name">{item.name}</span>
                        <span className="product-sku">ID: {item._id.substring(item._id.length - 6)}</span>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>₹{item.price}</td>
                    <td>
                      <span className={`badge ${stockBadgeClass}`}>
                        {item.quantity} in stock
                      </span>
                    </td>
                    <td>
                      <label className="status-toggle">
                        <input type="checkbox" checked={isActive} onChange={() => handleStatusToggle(item._id, isActive)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => openEditDrawer(item)} title="Edit"><Edit2 size={16} /></button>
                      <button className="action-btn delete" onClick={() => deleteItem(item._id)} title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Edit Product</h3>
              <button className="close-btn" onClick={() => setIsDrawerOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" required value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" required value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" required value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" style={{width: 'auto'}} checked={editForm.prescription} onChange={e => setEditForm({...editForm, prescription: e.target.checked})} />
                <label style={{marginBottom: 0}}>Requires Prescription</label>
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" style={{width: 'auto'}} checked={editForm.isActive} onChange={e => setEditForm({...editForm, isActive: e.target.checked})} />
                <label style={{marginBottom: 0}}>Active (Visible to users)</label>
              </div>
              <div className="drawer-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyItems;
