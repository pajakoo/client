import React, { useState, useEffect } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faPlus, faSearch, faLineChart } from '@fortawesome/free-solid-svg-icons';
import './App.css';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { Line } from 'react-chartjs-2';
import moment from 'moment';
import 'chartjs-adapter-moment';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function App() {
  const [inputValue, setInputValue] = useState('');
  const [shoppingList, setShoppingList] = useState([]);
  const [cheapestStores, setCheapestStores] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [url, setUrl] = useState('https://super-polo-shirt-tick.cyclic.app');
  const [selectedStore, setSelectedStore] = useState(null);
  const [productPriceHistories, setProductPriceHistories] = useState({});
  const [chartInstance, setChartInstance] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
  });

  const [chartDataConfig, setChartDataConfig] = useState({
    labels: [],
    datasets: [],
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


  useEffect(() => {
    if (Object.keys(productPriceHistories).length > 0) {
      createChart();
    }
  }, [productPriceHistories]);

  const fetchPriceHistory = (barcode, productId) => {
    fetch(`${url}/api/product/${barcode}/history`)
      .then((response) => response.json())
      .then((data) => {
        console.log(productPriceHistories);
        setProductPriceHistories((prevHistories) => ({
          ...prevHistories,
          [productId]: data,
        }));
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

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
    setProductPriceHistories((prevHistories) => {
      const updatedHistories = { ...prevHistories };
      delete updatedHistories[product._id];
      return updatedHistories;
    });
  };

  const handleFindCheapest = () => {
    if (shoppingList.length === 0) {
      return;
    }

    const selectedProduct = shoppingList[0];
    const { barcode } = selectedProduct;

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

  const getRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };

  const createChart = () => {
    const newChartDataConfig = {
      labels: [],
      datasets: [],
    };

    shoppingList.forEach((product) => {
      const history = productPriceHistories[product._id];
      if (history && history.length > 0) {
        const chartLabels = history.map((price) => moment(price.date).format('YYYY-MM-DD'));
        chartLabels.sort((a, b) => moment(a, 'YYYY-MM-DD').toDate() - moment(b, 'YYYY-MM-DD').toDate());
        const chartData = history.map((price) => price.price);

        newChartDataConfig.labels = chartLabels;
        newChartDataConfig.datasets.push({
          label: `Product ${product._id} Price`,
          data: chartData,
          borderColor: getRandomColor(),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
          fill: true,
        });
      }
    });
    

    setChartDataConfig(newChartDataConfig);
  };

  const handleChartButtonClick = (product) => {
    fetchPriceHistory(product.barcode, product._id);
    setShoppingList((prevList) =>
      prevList.map((item) =>
        item._id === product._id ? { ...item, isChartButtonActive: !item.isChartButtonActive } : item
      )
    );
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
        {isOpen && selectedStore && (
          <InfoWindow position={{ lat: selectedStore.latitude, lng: selectedStore.longitude }} disableAutoClose={true}>
            <h3>{selectedStore.store}</h3>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };

  return (
    <div className="container">
      <h1 className="mt-4">Списък за пазаруване</h1>
      <div className="mb-3">
        {suggestedProducts.length > 0 && (
          <Typeahead
            id="productTypeahead"
            options={suggestedProducts}
            labelKey={(option) => option.name}
            onChange={handleInputChange}
            selected={inputValue ? [inputValue] : []}
          />
        )}
      </div>
      <div className="mb-3 d-flex flex-wrap">
        <button className="btn btn-primary mb-2 w-100" onClick={handleFindCheapest}>
          <FontAwesomeIcon icon={faSearch} /> Намери най-евтино
        </button>
      </div>

      <ul className="list-group mb-4">
        {shoppingList.map((product) => (
          <li
            key={product._id}
            className={`list-group-item d-flex justify-content-between align-items-center`}
          >
            {product.name}
            <div className="d-flex">
              <button
                className={`btn btn-sm btn-default ${
                  product.isChartButtonActive ? 'active' : ''
                }`}
                onClick={() => handleChartButtonClick(product)}
              >
                <FontAwesomeIcon icon={faLineChart} />
              </button>
              <button
                className="btn btn-sm btn-danger ms-2"
                onClick={() => handleRemoveProduct(product)}
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mb-4">
        {chartDataConfig.labels.length > 0 && <Line data={chartDataConfig} />}
      </div>

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
