import React, { useState, useEffect } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import './App.css';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [shoppingList, setShoppingList] = useState([]);
  const [cheapestStores, setCheapestStores] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [url, setUrl] =  useState('https://super-polo-shirt-tick.cyclic.app');//useState('http://localhost:3333');//
  const [selectedStore, setSelectedStore] = useState(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
  });

  useEffect(() => {
    fetch(`${url}/api/products-client`)
      .then((response) => response.json())
      .then((data) => {
        setSuggestedProducts(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, [url]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedStore({ latitude, longitude });
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);
  

  const handleInputChange = (selected) => {
    if (selected && selected.length > 0) {
      const selectedProduct = selected[0];
      const isProductAlreadyAdded = shoppingList.some((product) => product.name === selectedProduct.name);
      if (!isProductAlreadyAdded) {
        setShoppingList((prevList) => [...prevList, selectedProduct]);
      }
    } else {
      setInputValue('');
    }
  };

  const handleRemoveProduct = (product) => {
    setShoppingList((prevList) => prevList.filter((p) => p._id !== product._id));
  };

  const handleFindCheapest = () => {
    fetch(`${url}/api/cheapest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shoppingList),
    })
      .then((response) => response.json())
      .then((data) => {
        setCheapestStores(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleStoreClick = (store) => {
    setSelectedStore(store);
  };

  const renderMap = () => {
    if (loadError) {
      return <div>Error loading Google Maps</div>;
    }

    if (!isLoaded) {
      return <div>Loading...</div>;
    }

    return (
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '400px' }}
        center={selectedStore ? { lat: selectedStore.latitude, lng: selectedStore.longitude } : { lat: 0, lng: 0 }}
        zoom={18}
      >
        {selectedStore && (
          <Marker
            position={{ lat: selectedStore.latitude, lng: selectedStore.longitude }}
            label={{
              text: selectedStore.store,
              className: 'custom-marker-label',
              style: {
                color: 'white',
                background: '#1976D2',
                borderRadius: '4px',
                padding: '4px',
              },
            }}
          />
        )}
      </GoogleMap>
    );
  };

  return (
    <div className="container">
      <h1 className="mt-4">Списък за пазаруване</h1>
      <div className="mb-3">
        <Typeahead
          id="productTypeahead"
          options={suggestedProducts}
          labelKey={(option) => option.name}
          onChange={handleInputChange}
          selected={inputValue ? [inputValue] : []}
        />
      </div>
      <div className="mb-3 d-flex flex-wrap">
        <button className="btn btn-primary mb-2 w-100" onClick={handleFindCheapest}>
          <FontAwesomeIcon icon={faSearch} /> Намери най-евтино
        </button>
      </div>

      <ul className="list-group mb-4">
        {shoppingList.map((product) => (
          <li key={product._id} className="list-group-item d-flex justify-content-between align-items-center">
            {product.name}
            <button className="btn btn-sm btn-danger" onClick={() => handleRemoveProduct(product)}>
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </li>
        ))}
      </ul>
      {cheapestStores.length > 0 ? (
        <div>
          <h4>Най-евтини места за покупка:</h4>
          <ul className="list-group mb-4">
            {cheapestStores.map((store, index) => (
              <li key={index} className="list-group-item">
                <div onClick={() => handleStoreClick(store)}>
                  В <b>{store.store}</b> можете да го закупите за обща сума от{' '}
                  <b>
                    {new Intl.NumberFormat('bg-BG', {
                      style: 'currency',
                      currency: 'BGN',
                    }).format(store.totalPrice.toString())}
                  </b>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <p>Няма намерени резултати.</p>
        </div>
      )}
      {isLoaded && renderMap()}
    </div>
  );
}

export default App;
