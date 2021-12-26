import { render } from 'preact';
import App from './app';
import './style/main.css';

let t = new Date().getTime();
console.log('start render');

render(<App />, document.getElementById('app')!)

t = new Date().getTime() - t;
console.log(`finished, took ${t}ms!`);
