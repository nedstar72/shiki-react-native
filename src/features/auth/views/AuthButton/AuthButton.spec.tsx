import React from 'react';
import { render, screen } from '@testing-library/react-native';

import AuthButton from './index';

describe('AuthButton', () => {
  it('должен содержать текст авторизации', () => {
    render(<AuthButton />);

    expect(screen.getByText('AuthButton')).toBeDefined();
  });
});
