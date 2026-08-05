from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

# Create your tests here.

from .models import Application, ApplicationState


class ApplicationTests(APITestCase):
    def test_create_defaults_to_applied_state(self):
        url = reverse('application-list')
        data = {
            'title': 'Software Engineer I',
            'company': 'ACME',
            'date_applied': '2026-08-02',
            'state': ApplicationState.OFFERED,
            'link': '',
        }

        res = self.client.post(url, data, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['state'], ApplicationState.APPLIED)

    def test_filter_by_state(self):
        Application.objects.create(
            title='Backend Engineer',
            company='Acme',
            date_applied='2026-08-01',
            state=ApplicationState.APPLIED,
        )
        Application.objects.create(
            title='Frontend Engineer',
            company='Globex',
            date_applied='2026-08-01',
            state=ApplicationState.OFFERED,
        )

        url = reverse('application-list')
        res = self.client.get(url, {'state': ApplicationState.APPLIED})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['company'], 'Acme')

    def test_no_state_filter_returns_all(self):
        Application.objects.create(
            title='Backend Engineer',
            company='Acme',
            date_applied='2026-08-01',
            state=ApplicationState.APPLIED,
        )
        Application.objects.create(
            title='Frontend Engineer',
            company='Globex',
            date_applied='2026-08-01',
            state=ApplicationState.OFFERED,
        )

        url = reverse('application-list')
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
