const puppeteer = require('puppeteer')
const fs = require('fs')

async function scrape() {
    const browser = await puppeteer.launch({})
    const page = await browser.newPage()

    // Exercise for the reader: iterate over the number of pages required...
    var pageNumber = 1;

    await page.goto(`https://store.nintendo.com.au/au/digital-games/recent-releases?p=${pageNumber}&product_list_limit=24`)
    let product_item_infos = await page.evaluate(() => {
        let data = [];
        let elements = document.getElementsByClassName('product-item-details');
        
        for (var element of elements) {
            var productItemLink = element.getElementsByClassName('product-item-link')[0];

            var title = productItemLink.innerHTML.trim();

            var link;
            if (productItemLink.href) {
                // Regular title, anyone can view without a modal showing
                link = productItemLink.href;
            }
            else {
                // Some titles need confirmation from the user before being viewed
                var json = productItemLink.attributes.getNamedItem("data-eshop-confirmation-post").value;
                var eshopConfirmationPost = JSON.parse(json);
                link = eshopConfirmationPost.action;
            }

            if (link.startsWith("https://ec.nintendo.com/AU/en/bundles/")) {
                productType = "bundle";
            }
            else if (link.startsWith("https://ec.nintendo.com/AU/en/titles/")) {
                productType = "title";
            }
            else {
                productType = "unknown";
            }

            var priceElement = element.querySelector('span[data-price-type="finalPrice"]');
            var price = priceElement.getElementsByClassName("price")[0].innerHTML;

            var originalPriceElement = element.querySelector('span[data-price-type="oldPrice"]');
            var originalPrice = null;
            if (originalPriceElement) {
                originalPrice = originalPriceElement.getElementsByClassName("price")[0].innerHTML;
            }

            var isDiscounted = originalPrice !== null && price !== null && price < originalPrice;

            data.push({
                title: title,
                price: price,
                original_price: originalPrice,
                product_type: productType,
                link: link,
                is_discounted: isDiscounted
            });
        }

        return data;
    }).catch(reason => {
        console.log(reason);
    });

    browser.close()

    // Exercise for the reader: Do something with the data

    // For now dump it to console
    var output = JSON.stringify(product_item_infos);
    console.log(output);

    // And dump to a file
    fs.writeFile('new_releases.json', output, function (err) {
        if (err) {
            console.log('Could not write to new_releases.json');
            return console.log(err);
        }
    });
}

scrape();