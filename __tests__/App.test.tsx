/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  expect(tree).toBeTruthy();
  await ReactTestRenderer.act(async () => {
    tree?.unmount();
  });
});
