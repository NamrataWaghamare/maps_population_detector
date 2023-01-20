import "./styles.css";
import Map from "./Map/Map";
import {useEffect, useState} from "react";
import icon from "./Images/share-icon.png";
import {useSearchParams} from 'react-router-dom';
import Modal from "./Modal/Modal";
import useModal from './Modal/useModal';

export default function App() {
  const [coords, setCorrds] = useState({
    latitude: 42.3554334,
    longitude: -71.060511
  });
  const [displayName, setName] = useState("");
  const [populationDetails, setPopulationdetails] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [displayPopulationDetails, setDisplayPopulationDetails] = useState([]);
  const [searchMsg, setSearchMsg] = useState("");
  const [address, setAddress] = useState({});
  const [historyList, setHistoryList] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [notClickable, setNotClickable] = useState(false);
  const {isShowing, toggle} = useModal();
  const mapClickLatLng = (lat, lng) => {
    getMapClickCityName(lat, lng);
  }

  useEffect(() => {
    getDefaultCityName();
  }, []);

  //separete the entred string
  function update(field) {
    return (e) => {
      const value = e.currentTarget.value;
      setAddress((address) => ({ ...address, [field]: value }));
    };
  }

  //Menu functions
  function scrolltop (id) {
    window.scrollTo(0, 0);
  }

  function shareLink () {
    navigator.clipboard.writeText(window.location.href);
    toggle();
  }

  function findHistory () {
    const element = document.getElementById('history');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
  }

  //set loader function
  function setLoader() {
    setLoadingMsg(<div class="loader">Loading...</div>);
    setNotClickable(true);
    setSearchResults([]);
    setSearchMsg("");
    address.location = "";
    setDisplayPopulationDetails();
  }

  //Common function to set values
  function setValues(data, name) {
    setCorrds({
      latitude: data.centroid.coordinates[1],
      longitude: data.centroid.coordinates[0]
    });
    setName(name);
    const population = data.extratags.population ? data.extratags.population : "Unkown";
    const populationDate = data.extratags['population:date'] ? data.extratags['population:date'] : "Unkown";
    setPopulationdetails({
      population: population,
      populationDate: populationDate
    });
    setCoordinates(data.geometry.coordinates);
    setDisplayPopulationDetails(
      <div class="population-section">
        <img class="share-img" src={icon} onClick={shareLink}></img>
          <span class="name">{name}</span>
          <div>
            <ul class="points">
              <li class="population-list">
                <span class="value">Population: {population}</span>
              </li>
              <li class="population-list">
                <span class="value">Date: {populationDate}</span>
              </li>
            </ul>
          </div>
      </div>
    );   
    setLoadingMsg("");
    setNotClickable(false);
  }


  //Common function to get on click map city name
  function getMapClickCityName(lat, lng){
    let url = `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=fr&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    setLoader();

    fetch(url, {
      method: "GET",   
      mode: 'cors', 
      headers: {
        "Access-Control-Allow-Origin": "https://o2cj2q.csb.app"
      }
    })
      .then((response) => response.json())
      .then((data) => {
        submitHandlerPopulation(data.osm_id, data.osm_type, data.address.country);
      }).catch((error) => {
        console.log("Error in your input; unable to find the position");
      });
  }

  //Function to set default location to Boston, MA
  function getDefaultCityName(){
    let onloadOsmid = searchParams.get('osmid') ? searchParams.get('osmid') : 2315704;;
    let onloadOsmType = searchParams.get('osmtype') ? searchParams.get('osmtype') : "Boston, MA";
    let onloadName = searchParams.get('name') ? searchParams.get('name') : "Boston, MA";
    let osmType = (onloadOsmType) ? ((onloadOsmType == 'way') ? ('W') : ((onloadOsmType == 'node') ? ('N') : ('R'))) : ('R');
    
    let url = `https://nominatim.openstreetmap.org/details?osmtype=${osmType}&osmid=${onloadOsmid}&polygon_geojson=1&format=json`;
    setLoader();

    fetch(url, {
      method: "GET",   
      mode: 'cors', 
      headers: {
        "Access-Control-Allow-Origin": "https://o2cj2q.csb.app"
      }
    })
      .then((response) => response.json())
      .then((data) => {
        setValues(data, onloadName);
        if (historyList.length <= 0) {
          historyList.push({
            location: onloadName,
            link: window.location.href,
            osm_id: onloadOsmid,
            osm_type: osmType
          });
          setHistoryList(historyList);
        }
      }
    ).catch((error) => {
      console.log("Error in your input; unable to find the position");
    });
    
  }

  //function to fetch search result 
  function submitHandler(e) {
    e.preventDefault();
    setErrorMsg(address.location ? "" : "Location is required");
    if (address.location) {
      let url = `https://nominatim.openstreetmap.org/search?type=administrative&q=${address.location}&format=json`;
      setLoader();

      setNotClickable(false);
      fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Access-Control-Allow-Origin": "https://o2cj2q.csb.app"
        }
      })
        .then((response ) => {
          if( response.ok){
            return response.json();
          }
          throw new Error('Something went wrong');
        })
        .then(
          (data) => {
            var data_filter = data.filter( element => element.osm_type=="relation");
            setSearchMsg(<li class="close-search">
                  <span class="value">Search Results</span>
                  <span onClick={closeSearch} class="value">X</span>
              </li>
            );
            setSearchResults(data_filter);
            setLoadingMsg("");
            setNotClickable(false);
            setDisplayPopulationDetails();
          }
        ).catch((error) => {
          console.log("Error in your input; unable to find the position");
        });
    }
  }

  //function to fetch population deatils
  function submitHandlerPopulation(osm_id, osm_type, display_name) {
    let osmType = (osm_type == 'way') ? 'W' : ((osm_type == 'node') ? ('N') : ('R'));
    let url = `https://nominatim.openstreetmap.org/details?osmtype=${osmType}&osmid=${osm_id}&polygon_geojson=1&format=json`;
    scrolltop();
    setLoader();

    fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Access-Control-Allow-Origin": "https://o2cj2q.csb.app"
      }
    })
      .then((response ) => {
        if( response.ok){
          return response.json();
        }
        throw new Error('Something went wrong');
      })
      .then(
        (data) => {
          setValues(data, display_name);
          historyList.push({
            location: display_name,
            link: window.location.href,
            osm_id: osm_id,
            osm_type: osm_type
          });
          setHistoryList(historyList);
          setSearchParams({osmid: osm_id,name: display_name, osmtype: osm_type}); 
          setSearchResults([]);
          setSearchMsg("");
          address.location = "";
        }
      ).catch((error) => {
        console.log("Error in your input; unable to find the position");
      });
  }

  const searchResultList = (searchResults || []).map((search) =>
    <li class="search-list" onClick={() => submitHandlerPopulation(search.osm_id, search.osm_type, search.display_name)}>
      <span class="value">{search.display_name}</span>
     </li>
  );

  //function to close search results
  function closeSearch () {
    address.location = "";
    setSearchMsg();
    setSearchResults([]);
    setDisplayPopulationDetails(
      <div class="population-section">
        <img class="share-img" src={icon} onClick={shareLink}></img>
          <span class="name">{displayName}</span>
          <div>
            <ul class="points">
              <li class="population-list">
                <span class="value">Population: {populationDetails.population}</span>
              </li>
              <li class="population-list">
                <span class="value">Date: {populationDetails.populationDate}</span>
              </li>
            </ul>
          </div>
      </div>
    );
  }

  //display search history
  const list = (historyList || []).map((history) =>
    <li class="history-list" onClick={() => submitHandlerPopulation(history.osm_id, history.osm_type, history.location)} >
        <span class="value">{history.location}</span>
      </li>
  );

  return (
    <div className="App"> 
      <div class="header">
        <div class="title-section">
          <h2 class="title" onClick={() => {setSearchParams();window.location.reload(false);}}>Maps - Population Detector</h2>
        </div>
        <div class="menu-list">
          <span class="last-menu" onClick={findHistory}>History</span>
          {notClickable ? <span class="menuDisabled">Share</span> : <span class="menu" onClick={shareLink}>Share</span>}          
          <span class="menu" onClick={scrolltop}>Search</span>
        </div>
      </div>
      
      <section className="form-container">
        <form>
          <input
            placeholder="Search Location"
            type="text"
            value={address.location}
            onChange={update("location")}
            id="location"
          />
          <button onClick={(e) => submitHandler(e)}>Search</button>
          <div class="error-msg">
            <span class="orange-text">{errorMsg}</span>
          </div>
        </form>
      </section>

      <div class="map-section">
        <div id="info">
          <div class="left-section">      
            {loadingMsg}
            {searchMsg}
            {searchResultList}
            {displayPopulationDetails}
          </div>
        </div>
        <div id="map">
          <Map coords={coords} displayName={displayName} coordinates={coordinates} mapClickLatLng={mapClickLatLng}/>
        </div>
      </div>  
     
      <div id="history">
          <h3 class="history-title" >Search History</h3>
          <ul class="history-points">{list}</ul>
      </div>

      <div class="footer"></div>
      <Modal
        isShowing={isShowing}
        hide={toggle}
      />
    </div>
  );
}