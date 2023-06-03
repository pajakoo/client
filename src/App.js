import React, { useState, useEffect } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [shoppingList, setShoppingList] = useState([]);
  const [cheapestStores, setCheapestStores] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  useEffect(() => {
    // Извличане на наличните продукти от API на сървъра и актуализиране на състоянието на предлаганите продукти
    fetch('https://super-polo-shirt-tick.cyclic.app/api/products-client')
      .then((response) => response.json())
      .then((data) => {
        setSuggestedProducts(data);
      })
      .catch((error) => {
        console.error('Грешка:', error);
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
    // Изпратка на заявка към сървъра с информацията за списъка с покупки
    // Предаване на списъка с продукти на сървъра и изпълнение на логиката за намиране на най-евтините цени

    // Пример за използване на fetch за изпращане на заявка
    fetch('https://super-polo-shirt-tick.cyclic.app/api/cheapest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shoppingList)
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Актуализиране на състоянието на най-евтините магазини с получените данни от сървъра
        setCheapestStores(data);
      })
      .catch((error) => {
        console.error('Грешка:', error);
      });
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
      <div className="mb-3">
        <button className="btn btn-primary me-2" onClick={handleAddProduct}>
          Добави продукт
        </button>
        <button className="btn btn-primary" onClick={handleFindCheapest}>
          Намери най-евтино
        </button>
      </div>
      <ul className="list-group mb-4">
        {shoppingList.map((product) => (
          <li key={product._id} className="list-group-item d-flex justify-content-between align-items-center">
            {product.name}
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleRemoveProduct(product)}
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </li>
        ))}
      </ul>
      {cheapestStores.length > 0 && (
        <div>
          <h4>Най-евтини места за покупка:</h4>
          <ul className="list-group mb-4">
            {cheapestStores.map((store, index) => (
              <li key={index} className="list-group-item">
                В <b>{store.store}</b> можете да го закупите за обща сума от{' '}
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
