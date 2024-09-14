const ratingContainer = document.querySelector('.rating');
const fullStar = ratingContainer.getAttribute('data-full-star');
const halfStar = ratingContainer.getAttribute('data-half-star');
const emptyStar = ratingContainer.getAttribute('data-empty-star');
function getRating(rating) {
    let starsHTML = '';
    let fullStars = Math.floor(rating);
    let halfStars = (rating % 1) >= 0.5 ? 1 : 0;
    let emptyStars = 5 - fullStars - halfStars;
    for (let i = 0; i < fullStars; i++) {
        starsHTML += `<img src="${fullStar}" alt="Full Star">`;
    }

    if (halfStars > 0) {
        starsHTML += `<img src="${halfStar}" alt="Half Star">`;
    }

    for (let i = 0; i < emptyStars; i++) {
        starsHTML += `<img src="${emptyStar}" alt="Empty Star">`;
    }

    return starsHTML;
}
