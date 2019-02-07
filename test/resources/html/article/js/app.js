/**
 * Toggle the navigation UI for the AEM Mobile On-Demand Services app viewer.
 */
function toggleNavUi() {
	$('#logs').prepend('calling toggleNavigationUI()<br/>');
	adobeDPS.Gesture.toggleNavigationUI();
}

/**
 * Opt into the AEM Mobile On-Demand Services advanced contract
 * @param elementList - The single or list of HTML elements
 */
function optInAdvContract(elementList) {
	try {
		adobeDPS.Gesture.disableNavigation(elementList);
	} catch (error) {
		console.log('error', error);
		$('#gesture').text(error.message);
	}
}

/**
 * Run once all documentations are ready
 */
$(document).ready(function() {
	// load Foundation framework
	$(document).foundation({
		orbit: { // customize Foundation's Orbit slideshow
			bullets: false, // hide bullets
			navigation_arrows: false, // hide navigation arrows
			circular: false,
			slide_number: false, // hide slide number
			timer: false, // disables autoplay for orbit sldieshow
		}
	});

	/**
	 * Local variables and functions
	 */
	var touch_data = {}, // container of data for all the orbit slideshows
		$slide_number_field = $('#guid'),
		$gesture_field = $('#gesture-text'),
		genTouchData = function() { // generate initial data per orbit slideshow
			var data = {
				is_horizontal_scroll: undefined,
				touch_start_x: -1,
				touch_start_y: -1,
				slide_prev: 1,
				slide_total: -1,
			};
			return data;
		},
		orbitTouchHandler = function($orbit) { // bind swipe handler to orbit slideshow
			var guid = Math.floor((Math.random() * 1000) + 1);

			$orbit.on('touchstart.fndtn.orbit', {guid: guid}, orbitTouchStart);
			$orbit.on('touchmove.fndtn.orbit', {guid: guid}, orbitTouchMove);
		},
		/**
		 * Start of a unique swipe for a slideshow
		 */
		orbitTouchStart = function(event) {
			// get touch data GUID (WRT the slideshow)
			var guid = event.data.guid;
			// set the touch events
			if (!event.touches) {
				event = event.originalEvent;
			}
			// ignore pitch and zoom events
			if (event.touches.length > 1 ||
				event.scale && event.scale !== 1) {
				return;
			}
			// initialize touch data for this slideshow if none existed
			if (!touch_data[guid]) {
				touch_data[guid] = genTouchData();
			}
			// reset some of the touch data for this swipe
			touch_data[guid].is_horizontal_scroll = undefined;
			touch_data[guid].touch_start_x = event.touches[0].pageX;
			touch_data[guid].touch_start_y = event.touches[0].pageY;
		},
		/**
		 * The whole duration of a unique swipe for a slideshow.
		 */
		orbitTouchMove = function(event) {
			// get touch data GUID (WRT the slideshow)
			var guid = event.data.guid;
			// set the touch events
			if (!event.touches) { event = event.originalEvent; }
			// find the slideshow WRT this swipe
			var $this = $(this),
				$slides = $this.find('li'),
				// calculate the swipe difference in x and y
				// used to determine a horizontal vs vertical swipe
				swipe_delta_x = event.touches[0].pageX - touch_data[guid].touch_start_x,
				swipe_delta_y = event.touches[0].pageY - touch_data[guid].touch_start_y;
			// detect a horizontal swipe,
			// should only happen once per unique swipe
			if (Math.abs(swipe_delta_x) > Math.abs(swipe_delta_y) &&
				!touch_data[guid].is_horizontal_scroll) {
				// determines the swipe direction
				var gesture = 'none',
					slide_total = $slides.length,
					slide_active = $this.find('.active').first(),
					slide_current = ($slides.index(slide_active))+1;
					swipe_direction = (swipe_delta_x < 0) ? 'left' : 'right';
				// determine when to relinquish controls
				if (swipe_direction === 'left') { // swipe left
					if (slide_current === slide_total) { // swipe left on last slide
						gesture = 'swipe left on last slide';
						// active the DPS Gesture API: relinquish
						// gives control back to the app viewer
						adobeDPS.Gesture.relinquishCurrentGesture();
						$('#logs').prepend('calling relinquishCurrentGesture()<br/>');
					} else {
						gesture = 'swipe left';
					}
				} else if (swipe_direction === 'right') { // swipe right
					if (slide_current === 1) { // swipe right on first slide
						gesture = 'swipe right on first slide';
						// active the DPS Gesture API: relinquish
						// gives control back to the app viewer
						adobeDPS.Gesture.relinquishCurrentGesture();
						$('#logs').prepend('calling relinquishCurrentGesture()<br/>');
					} else {
						gesture = 'swipe right';
					}
				}
				// stores the current slide as previous
				touch_data[guid].slide_prev = slide_current;
				touch_data[guid].is_horizontal_scroll = true;
				$slide_number_field.text(guid);
				$gesture_field.text(gesture);
				console.log(guid, slide_current, slide_total, gesture);
			}
		};

	// select the header slideshow and body slideshow
	var $orbitSliderHeader = $('#headerImage .slideshow');
	var $orbitSliderContent = $('#content .large-4 .slideshow');

	// call helper to bind the orbit on-swipe events
	orbitTouchHandler($orbitSliderHeader);
	orbitTouchHandler($orbitSliderContent);

	// opt-into Adobe Publish gesture control for orbit slideshow and bullets
	optInAdvContract([$orbitSliderHeader[0], $orbitSliderContent[0]]);
});