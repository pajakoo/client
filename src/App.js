import React, { useState, useEffect } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [shoppingList, setShoppingList] = useState([]);
  const [cheapestStores, setCheapestStores] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  useEffect(() => {
    // Fetch existing products from the backend API and update the suggestedProducts state
    fetch('http://localhost:3333/api/products-client')
      .then((response) => response.json())
      .then((data) => {
        setSuggestedProducts(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  const handleInputChange = (selected) => {
    if (selected && selected.length > 0) {
      setInputValue(selected[0]);
    } else {
      setInputValue('');
    }
  };

  const handleAddProduct = () => {
    if (inputValue) {
      setShoppingList((prevList) => [...prevList, inputValue]);
      setInputValue('');
    }
  };

  const handleRemoveProduct = (product) => {
    setShoppingList((prevList) => prevList.filter((p) => p.name !== product.name));
  };
  

  const handleFindCheapest = () => {
    // Make an API call to your backend server with the shopping list data
    // Pass the list of products to the server and implement the logic to find the cheapest prices

    // Example API call using fetch
    fetch('http://localhost:3333/api/cheapest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shoppingList)
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Update the cheapestStores state with the response data
        setCheapestStores(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  return (
    <div className="container">
      <h1 className="mt-4">Shopping List</h1>
      <div className="mb-3">
        <Typeahead
          id="productTypeahead"
          options={suggestedProducts}
          labelKey={(option) => option.name}
          onChange={handleInputChange}
          selected={inputValue ? [inputValue] : []}
        />
      </div>
      <div className="mb-3">
        <button className="btn btn-primary me-2" onClick={handleAddProduct}>
          Add Product
        </button>
        <button className="btn btn-primary" onClick={handleFindCheapest}>
          Find Cheapest
        </button>
      </div>
      <ul className="list-group mb-4">
        {shoppingList.map((product) => (
          <li key={product._id} className="list-group-item">
            {product.name}
            <button
              className="btn btn-sm btn-danger ms-2"
              onClick={() => handleRemoveProduct(product)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {cheapestStores.length > 0 && (
        <div>
          <h4>Cheapest places to buy:</h4>
          <ul className="list-group mb-4">
            {cheapestStores.map((store, index) => (
              <li key={index} className="list-group-item">
                In <b>{store.store}</b> you will buy it for a total of{' '}
                <b>
                  {new Intl.NumberFormat('bg-BG', {
                    style: 'currency',
                    currency: 'BGN'
                  }).format(store.totalPrice.toString())}
                </b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
