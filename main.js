/* Put your flickr API key here */
//var flickr_api = 'fcdd4a2081838c8ce72fba26e05222c7';
/* Put the account you want to get photos from here */
//var flickr_acct = '125635395@N03';

/*
 * Load a few pictures from the given user and set it as the background
 */
function loadPicture(){
    chrome.storage.local.get(['images'],
    function(result) {
        if (result['images'] != null) {
            setPictureFromArray(result['images']);
        } else {
            $.getJSON(
                "http://api.flickr.com/services/rest/",
                {
                    method: 'flickr.people.getPublicPhotos',
                    api_key: flickr_api,
                    user_id: flickr_acct,
                    format: 'json',
                    nojsoncallback: 1,
                    extras: "description, license, date_upload, date_taken, owner_name, icon_server, original_format, last_update, geo, tags, machine_tags, o_dims, views, media, path_alias, url_sq, url_t, url_s, url_q, url_m, url_n, url_z, url_c, url_l, url_o",
                    per_page: 1000
                },
                function(response) {
                    if(response.stat != 'ok'){
                        console.error(response);
                        $('body').css('background-image', 'url("default.jpg")'); // Default image
                    }
                    var array = response.photos.photo;
                    setPictureFromArray(array);
                    chrome.storage.local.set({'images': array}, function() {
                        //console.log('Cached images');
                    });
                }
            );
        }
    });
}


/*
 * Pull a random photo and pass the chosen URL to the given function
 */
function pullPhoto(array, func) {
    var photo = array[ Math.floor( Math.random() * array.length ) ];
    $.getJSON(
        "http://api.flickr.com/services/rest/",
        {
            method: 'flickr.photos.getSizes',
            api_key: flickr_api,
            photo_id: photo.id,
            format: 'json',
            nojsoncallback: 1,
            cache: true
        },
        function(response){
            if(response.stat != 'ok'){
                console.error(response);
                $('body').css('background-image', 'url("default.jpg")'); // Default image
            }
            var image = response.sizes.size.filter(function(x) { return x['label'] == 'Original'; })[0];
            var url = image.source;
            func(url);            
        }
    );
}

/*
 * Check the cache for a preloaded image.
 * If it exists, use that image as a background.
 * If it doesnt exist. Pull a new image for the background.
 * Once we are done, add a new image to the cache
 * TODO: Not sure if this actually caches. I think chrome will cache it automatically if we use the same url
 */
function setPictureFromArray(array){
    chrome.storage.local.get(['next_image'],
    function(result) {
        if (result['next_image'] != null) {
            // Apply the cached image
            $('body').css('background-image', 'url(' + result['next_image'] + ')');
            //console.log("Got image from the cache: " + result['next_image']);
        } else {
            // Pull a new photo for the background
            pullPhoto(array, function(img){
                $('body').css('background-image', 'url(' + img + ')');
                //console.log("Had to download a whole new image: " + img);
            })
        }

        // Pull a new photo for the cache
        pullPhoto(array, function(url) {
            chrome.storage.local.set({'next_image': url}, function(x) {
                //console.log('Cached next image: ' + url);
            });
        })
    });
}


/*
 * Update the clock and date
 */
function startTime() {
    const mons = ["Jan", "Feb", "Mar", "Apr", "May", "June",
        "July", "Aug", "Sept", "Oct", "Nov", "Dec"
    ];
    var t = new Date();
    // Pad the minute with zeros
    var m = t.getMinutes();
    if (m < 10) {
        m = "0" + m
    };
    // Update the time object
    $('#time').html(t.getHours() + ":" + m);
    // Update the date object
    $('#date').html(mons[t.getMonth()] + " " + t.getDate() +', ' + t.getFullYear());
    // Run again in 10 seconds
    var t = setTimeout(startTime, 500);
}


startTime(); // Start the clock

if (flickr_api == "xxxxxxxxxxxxxxx" || flickr_acct == "xxxxxxxxxxxxxxx") {
    console.error("Set the flickr API and the flickr account to read from")
    $('body').css('background-image', 'url("default.jpg")'); // Default image
} else {
    loadPicture(); // Get some pictures
}

console.log("Check me out on Github! https://github.com/micahjmartin/newtab-chrome");