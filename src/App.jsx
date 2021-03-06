import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import './App.css';
import MainRouter from './router';

import {
  X_AUTH_TOKEN,
} from './types';

import { initPosts } from './redux/posts/actions';
import { initAdmin } from './redux/admin/actions';
import { updateRate } from './redux/post-rate/actions';
import { initCategories } from './redux/categories/actions';
import { initUser, registerAsGuest } from './redux/user/actions';

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  console.log()

  React.useEffect(() => {
    const hasRun = false;

    const loadData = (success) => {
      if (!hasRun && success) {
        dispatch(initPosts(() => {
          if (location.search) {
            let postId = '';

            try {
              postId = location.search.split('?post=')[1];
            } catch (error) {
              console.log(error);
            }

            const scrollY = document.getElementById(`post-${postId}`).offsetTop;
            const scrollableElement = document.getElementById('main-sider');

            scrollableElement.scrollTo({
              left: 0,
              top: scrollY,
              behavior: 'smooth',
            })
          }
        }));
        dispatch(initCategories());
        dispatch(updateRate());
      }
    };

    const token = localStorage.getItem(X_AUTH_TOKEN);

    dispatch(initAdmin(() => {}));

    if (token) {
      dispatch(initUser(loadData));
    } else {
      dispatch(registerAsGuest(loadData));
    }
  });

  return (
    <MainRouter />
  );
};

export default App;
