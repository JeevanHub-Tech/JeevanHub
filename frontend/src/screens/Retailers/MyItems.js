import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/authFetch';

function MyItems() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const response = await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/medicines/my`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // Send JWT token
          },
        });

        const data = await response.json();
        if (response.ok) {
          setItems(data);
          console.log("Fetched items:", data);
        } else {
          setError(data.message || 'Failed to fetch items');
        }
      } catch (error) {
        setError('An error occurred while fetching items');
      }
    };

    fetchMyItems();
  }, []);

  return (
    <div className="items-grid">
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {items.map((item, index) => (
        <div key={index} className="item-card">
          {item.image && (
            <img 
              src={item.image.startsWith('http') ? item.image : `${process.env.REACT_APP_AYURVEDA_BACKEND_URL}${item.image}`} 
              alt={item.name} 
              style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px', marginBottom: '10px' }} 
            />
          )}
          <h3>{item.name}</h3>
          <p><strong>Price:</strong> ₹{item.price}</p>
          <p><strong>Quantity:</strong> {item.quantity}</p>
          <p><strong>Category:</strong> {item.category}</p>
          <div className="card-actions">
            <button className="edit-btn">Edit</button>
            <button className="delete-btn">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyItems;
