import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AudioPlayer from 'react-responsive-audio-player';
import { DefaultPlayer as VideoPlayer } from 'react-html5video';
import {
  FaTrash,
  FaComment,
  FaShareSquare,
  FaDownload,
} from 'react-icons/fa';

import Image from './Image';
import Comments from './Comments';
import StarRating from './StarRating';
import notification from './notifications';
import PaymentModal from './payment/PaymentModal';
import Paypal from './payment/Paypal';
import Stripe from './payment/Stripe';
import notifications from './notifications';

import { openPostModal } from '../redux/post-modal/actions';
import { redeemPost, ratePost, removePostUser } from '../redux/posts/actions';
import { APIRedeemPost } from '../api';

const Post = ({
  post,
  userId,
  userType,
  postRate,
  dispatch,
}) => {
  const [averageRating, setAverageRating] = React.useState(0);
  const [paymentModal, setPaymentModal] = React.useState(false);
  const [commentsOpen, setCommentsOpen] = React.useState(false);

  React.useEffect(() => {
    const { length } = post.rating;
    const rating = post.rating.reduce((a, r) => a + (r.ratingPoints / 20), 0);

    if (rating <= 0 && length <= 0) {
      setAverageRating(0);
    } else {
      setAverageRating(rating / length);
    }
  }, [post.rating]);

  const handleRatePost = (rating) => {
    dispatch(ratePost(post._id, rating));
  };

  const handlePreview = () => {
    dispatch(openPostModal(post._id, post.mediaUrl));
  };

  const handleToggleComments = () => {
    setCommentsOpen(!commentsOpen);
  };

  const handleShare = () => {
    window.navigator.clipboard.writeText(`${window.location.origin}/?post=${post._id}`);
    notification.success('Link Copied', 'Link for the post was successfully copied to your clipboard!');
  };

  const handleRemove = () => {
    dispatch(removePostUser(post._id));
  };

  const handleRedeemPost = (token, isStripe) => {
    const payload = token && isStripe
      ? { stripeToken: token, paymentMethod: true, postRate: postRate.rate * 100 }
      : { paymentMethod: false, postRate: postRate.rate };
    
    APIRedeemPost(post._id, payload)
      .then(() => {
        notifications.success('Post Redeemed', 'Your post has been successfully redeemed.');
        dispatch(redeemPost(post._id));
      })
      .catch(() => {
        notifications.success('Post Redeem Failed', 'Oops! Couldn\'t redeem the post, try again.');
      })
      .finally(() => setPaymentModal(false));
  };

  const handlePaypal = () => {
    handleRedeemPost(null, null);
  };

  const handleStripe = (token) => {
    handleRedeemPost(token.id, true);
  };

  const displayMedia = () => {
    if (post.mediaType === 'audio') {
      return (
        <AudioPlayer
          playlist={[
            { url: post.mediaUrl }
          ]}
        />
      );
    }

    if (post.mediaType === 'video') {
      return (
        <div className="text-center d-block w-100">
          <VideoPlayer
            controls={['PlayPause', 'Seek', 'Time', 'Volume', 'Fullscreen']}
          >
            <source src={post.mediaUrl} />
          </VideoPlayer>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handlePreview}
        className="button-invisible d-block w-100"
      >
        <Image
          rounded
          src={post.mediaUrl}
          alt="Will contain some text"
          className="filter-drop-shadow-gray media__image img-fluid object-fit-cover"
        />
      </button>
    );
  };

  return (
    <>
      {
        post.expired && post.postBy._id === userId && (
          <PaymentModal
            amount={postRate.rate}
            open={paymentModal}
            onClose={() => setPaymentModal(false)}
            paypal={<Paypal
              amount={postRate.rate}
              onSuccess={handlePaypal}  
            />}
            stripe={<Stripe
              amount={postRate.rate}
              onSuccess={handleStripe}
            />}
          />
        )
      }
      <div id={`post-${post._id}`} className="bg-white custom-rounded-2rem mt-4 p-4 custom-card">
        <div className="align-items-center align-items-md-baseline d-flex flex-column flex-md-row">
          <div>
            <Image
              circle
              alt="User"
              width="70px"
              height="70px"
              src={post.postBy.imageUrl}
              className="object-fit-cover"
            />
          </div>
          <div className="col text-center text-md-left">
            <div className="d-flex flex-column flex-md-row justify-content-between py-2 py-md-0 text-black-50">
              <span className="h3 mb-0">
                {post.postBy.name}
              </span>
              <span className="align-items-start d-flex flex-row">
                {
                  post.expired && post.postBy._id === userId && (
                    <strong className="d-inline-block mr-2">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPaymentModal(true)}
                      >
                        Redeem Post <i class="fa fa-recycle" />
                      </button>
                    </strong>
                  )
                }
                <span className="d-flex flex-column">
                  <small>
                    Posted At: {new Date(post.createdAt).toDateString().substring(4)}
                  </small>
                  <span className="h4 mb-0">
                    {
                      post.postRate <= 0
                        ? ''
                        : `Posted For ${post.postRate / 100}$`
                    }
                  </span>
              </span>
              </span>
            </div>
            <div className="h4 pb-2 pb-md-0 text-body">
              {post.description}
            </div>
            {
              userId === post.postBy._id && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="button-invisible"
                  >
                    <FaTrash className="icon-2x" />
                  </button>
                </div>
              )
            }
          </div>
        </div>
        <div className="pt-4 media">
          {displayMedia()}
        </div>
        <div className="align-items-center flex-column-reverse flex-md-row justify-content-between mx-0 mx-md-4 pt-2 row">
          <span className="d-flex align-items-center justify-content-center">
            <button
              type="button"
              onClick={handleToggleComments}
              className="d-flex align-items-center custom-gray-color h2 mb-0 mr-2"
            >
              <FaComment />
              <span className="ml-2">
                {post.comments.length}
              </span>
            </button>
            <a
              className="custom-gray-color h2"
              download
              href={post.mediaUrl}
              target="_blank"
            >
              <FaDownload />
            </a>
          </span>
          <div className="d-flex align-items-center">
            <button
              type="button"
              onClick={handleShare}
              className="custom-gray-color h2 mb-0 mr-2"
            >
              <FaShareSquare />
            </button>
            <span>
              <StarRating
                rating={averageRating}
                onChange={handleRatePost}
              />
            </span>
          </div>
        </div>
      </div>
      <Comments
        postId={post._id}
        isOpen={commentsOpen}
        comments={post.comments}
      />
    </>
  );
};

Post.defaultProps = {
  post: {},
  userId: '',
  userType: '',
  dispatch: null,
};

Post.propTypes = {
  userId: PropTypes.string,
  userType: PropTypes.string,
  dispatch: PropTypes.func,
  post: PropTypes.instanceOf(Object),
};

const mapStateToProps = (state) => ({
  userId: state.user._id,
  userType: state.user.userType,
  postRate: state.postRate,
});

export default connect(mapStateToProps)(Post);
