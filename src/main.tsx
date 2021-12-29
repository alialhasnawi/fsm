import { render } from 'preact';
import App from './app';
import './style/main.css';

console.time('Render Time');

render(<App />, document.getElementById('app')!)

console.timeEnd('Render Time');
