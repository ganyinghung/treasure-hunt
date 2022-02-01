
import { useWeb3, useSwitchNetwork } from "@3rdweb/hooks";
import './Main.css';
import App from './App';

function Main() {
  const { address, connectWallet } = useWeb3();
  return (
    address ? 
    (
      <App/>
    )
    :
    (
      <div className="Main">
        <div>
          <em className="nes-text is-success">Treasure Hunt</em> is a <br/>location-based NFT game.<br/>
          To start, connect your MetaMask wallet<br/><br/>
        </div>
        <div>
          <button className="nes-btn is-primary" onClick={() => connectWallet('injected')}>Connect</button>
          <button className="nes-btn is-error">Help</button>
        </div>
      </div>
    )
  );
}

export default Main;