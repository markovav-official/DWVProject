import scrapy
import time
from datetime import datetime

BASE_URL = 'https://stackoverflow.com/questions?tab=newest&pagesize=50'
MAX_PAGES = 5000

pages = 0


class StackOverflowQuestion(scrapy.Item):
    """ StackOverflow question item """

    title = scrapy.Field()
    url = scrapy.Field()
    votes = scrapy.Field()
    answers = scrapy.Field()
    views = scrapy.Field()
    tags = scrapy.Field()
    datetime = scrapy.Field()
    user = scrapy.Field()
    user_url = scrapy.Field()
    user_reputation = scrapy.Field()


class NWinnerSpiderBio(scrapy.Spider):
    """ Scrapes the Nobel prize biography pages for portrait images and a biographical snippet """

    name = 'stackoverflow_questions'
    allowed_domains = ['stackoverflow.com']
    start_urls = [BASE_URL]

    def parse(self, response):
        global pages
        pages += 1
        next_page_url = response.xpath(
            '//*[@id="mainbar"]/div[5]/a[contains(text(),"Next")]/@href').extract()
        questions = response.xpath('//*[@id="questions"]/div')

        for q in questions:
            stats_array = q.xpath('div/div/span/text()').extract()
            votes = parse_formatted_number(stats_array[0])
            answers = parse_formatted_number(stats_array[2])
            views = parse_formatted_number(stats_array[4])

            title_element = q.xpath('div[2]/h3/a')
            title = title_element.xpath('text()').extract()[0].strip()
            question_url = title_element.xpath('@href').extract()[0]

            tags = q.xpath('div[2]/div[2]/div[1]/ul/li/a/text()').extract()

            user_element = q.xpath('div[2]/div[2]/div[2]/div/div/a')
            if len(user_element) == 0:
                user = None
                user_url = None
                user_reputation = None
            else:
                user_url = user_element.xpath('@href').extract()[0]
                if not user_url.startswith('/users/'):
                    continue
                user = user_element.xpath('text()').extract()[0].strip()
                user_reputation = parse_formatted_number(
                    q.xpath('div[2]/div[2]/div[2]/div/ul/li[@class="s-user-card--rep"]/span/text()')
                        .extract()[0].replace(',', '')
                )
            
            dt_element = q.xpath('div[2]/div[2]/div[2]/time/span/@title').extract()[0].strip()
            dt = datetime.strptime(dt_element, '%Y-%m-%d %H:%M:%SZ')

            yield StackOverflowQuestion(
                title=title,
                url=question_url,
                votes=votes,
                answers=answers,
                views=views,
                tags=tags,
                datetime=dt,
                user=user,
                user_url=user_url,
                user_reputation=user_reputation
            )

        time.sleep(0.5)
        if pages < MAX_PAGES and len(next_page_url) != 0:
            yield scrapy.Request(response.urljoin(next_page_url[0]))


def parse_formatted_number(number):
    if number.endswith('m'):
        return int(float(number[:-1]) * 1000000)
    elif number.endswith('k'):
        return int(float(number[:-1]) * 1000)
    else:
        return int(number)
