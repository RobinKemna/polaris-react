import React from 'react';
import {matchMedia, animationFrame} from '@shopify/jest-dom-mocks';
import {mountWithApp} from 'tests/utilities';

import {Collapsible} from '../../../../Collapsible';
import {NavigationContext} from '../../../context';
import {Item} from '../../Item';
import {Section} from '../Section';

import channelResults from './fixtures/AdminNavQuery/multiple-channels.json';

describe('<Navigation.Section />', () => {
  let context: React.ContextType<typeof NavigationContext>;
  let cancelAnimationFrameSpy: jest.SpyInstance;

  beforeEach(() => {
    matchMedia.mock();
    animationFrame.mock();
    context = {
      location: '/admin/products',
      onNavigationDismiss: jest.fn(),
    };
    cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame');
  });

  afterEach(() => {
    matchMedia.restore();
    animationFrame.restore();
    cancelAnimationFrameSpy.mockRestore();
  });

  it('cancels the current animation frame when clicked', () => {
    const section = mountWithNavigationProvider(
      <Section
        items={[
          {
            label: 'some label',
            url: '/admin',
            disabled: false,
          },
        ]}
      />,
      {...context},
    );

    section.find(Item)!.trigger('onClick');
    section.find(Item)!.trigger('onClick');

    expect(cancelAnimationFrameSpy).toHaveBeenCalledTimes(1);
  });

  it('passes the right accessibilityLabel to its Button', () => {
    const mountedSection = mountWithNavigationProvider(
      <Section
        title="test"
        fill
        items={[
          {
            label: 'some label',
            url: '/admin',
            disabled: false,
          },
        ]}
        action={{
          icon: 'placeholder',
          accessibilityLabel: 'This is a test section',
          onClick: noop,
        }}
      />,
      {...context},
    );

    expect(mountedSection).toContainReactComponent('button', {
      'aria-label': 'This is a test section',
    });
  });

  it('calls iconButton.onClick when icon is clicked', () => {
    const spy = jest.fn();

    const section = mountWithNavigationProvider(
      <Section
        title="test"
        items={[
          {
            label: 'some label',
            url: '/admin',
            disabled: false,
          },
        ]}
        action={{
          icon: 'placeholder',
          accessibilityLabel: 'This is a test section',
          onClick: spy,
        }}
      />,
      {...context},
    );

    section.find('button')!.trigger('onClick');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders an array of items from props', () => {
    const section = mountWithNavigationProvider(
      <Section items={channelResults} />,
      {
        ...context,
      },
    );

    expect(section.findAll('li').length === channelResults.length).toBe(true);
  });

  it('calls onNavigationDismiss from context on sub item click', () => {
    const channels = mountWithNavigationProvider(
      <Section items={channelResults} />,
      {...context},
    );

    channels.find('a')!.trigger('onClick', {
      preventDefault: noop,
      currentTarget: {
        getAttribute: () => '/',
      },
    });
    animationFrame.runFrame();

    expect(context.onNavigationDismiss).toHaveBeenCalledTimes(1);
  });

  it('sets expanded to false on item click', () => {
    const channels = mountWithNavigationProvider(
      <Section
        items={channelResults}
        rollup={{after: 0, view: 'test', hide: 'test', activePath: '/'}}
      />,
      {...context},
    );

    channels
      .find('button', {className: 'Item RollupToggle'})!
      .trigger('onClick');
    channels.find('a')!.trigger('onClick', {
      preventDefault: noop,
      currentTarget: {
        getAttribute: () => '/admin/products',
      },
    });

    channels.act(() => {
      animationFrame.runFrame();
    });
    channels.forceUpdate();
    expect(channels).toContainReactComponent(Collapsible, {open: false});
  });

  it('does not set expanded to false on item click when it has a sub nav and on the mobile breakpoint', () => {
    matchMedia.setMedia(() => ({matches: true}));
    const withSubNav = mountWithNavigationProvider(
      <Section
        rollup={{
          after: 1,
          view: 'view',
          hide: 'hide',
          activePath: '/',
        }}
        items={[
          {
            label: 'some label',
            url: '/admin',
          },
          {
            label: 'other label',
            url: '/other',
            subNavigationItems: [
              {
                label: 'sub label',
                url: '/other',
              },
            ],
          },
        ]}
      />,
      {
        ...context,
      },
    );

    withSubNav
      .find('button', {className: 'Item RollupToggle'})!
      .trigger('onClick');
    withSubNav.find(Item, {url: '/other'})!.trigger('onClick');

    expect(withSubNav).toContainReactComponent(Collapsible, {open: true});
  });

  it('adds a toggle button if rollupAfter has a value', () => {
    const channels = mountWithNavigationProvider(
      <Section
        rollup={{
          after: 3,
          activePath: 'admin/themes',
          view: 'View all',
          hide: 'Hide',
        }}
        items={channelResults}
      />,
      {...context},
    );

    expect(channels).toContainReactComponent('button', {
      className: 'Item RollupToggle',
    });
  });

  it('passes the props to Item', () => {
    const section = mountWithNavigationProvider(
      <Section
        title="test"
        items={[
          {
            label: 'some label',
            url: '/admin',
            disabled: false,
          },
        ]}
        action={{
          icon: 'placeholder',
          accessibilityLabel: 'This is a test section',
          onClick: noop,
        }}
        separator
      />,
      {...context},
    );

    expect(section).toContainReactComponent(Item, {
      url: '/admin',
      disabled: false,
      label: 'some label',
    });
  });

  it('calls onClick callback when onClick on Item is triggered', () => {
    const onClickSpy = jest.fn();
    const section = mountWithNavigationProvider(
      <Section
        title="test"
        items={[
          {
            label: 'some label',
            url: '/admin',
            disabled: false,
            onClick: onClickSpy,
          },
        ]}
        action={{
          icon: 'placeholder',
          accessibilityLabel: 'This is a test section',
          onClick: noop,
        }}
        separator
      />,
      {...context},
    );

    section.find(Item)!.trigger('onClick');
    animationFrame.runFrame();

    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });
});

function mountWithNavigationProvider(
  node: React.ReactElement,
  context: React.ContextType<typeof NavigationContext> = {location: ''},
) {
  return mountWithApp(
    <NavigationContext.Provider value={context}>
      {node}
    </NavigationContext.Provider>,
  );
}

function noop() {}
