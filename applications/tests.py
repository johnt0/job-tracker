from django.contrib.auth.models import User
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Application, ApplicationState


class ApplicationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='pw12345')
        self.client.force_authenticate(self.user)

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
            owner=self.user,
        )
        Application.objects.create(
            title='Frontend Engineer',
            company='Globex',
            date_applied='2026-08-01',
            state=ApplicationState.OFFERED,
            owner=self.user,
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
            owner=self.user,
        )
        Application.objects.create(
            title='Frontend Engineer',
            company='Globex',
            date_applied='2026-08-01',
            state=ApplicationState.OFFERED,
            owner=self.user,
        )

        url = reverse('application-list')
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_junk_state_filter_returns_all(self):
        Application.objects.create(
            title='Backend Engineer',
            company='Acme',
            date_applied='2026-08-01',
            state=ApplicationState.APPLIED,
            owner=self.user,
        )
        Application.objects.create(
            title='Frontend Engineer',
            company='Globex',
            date_applied='2026-08-01',
            state=ApplicationState.OFFERED,
            owner=self.user,
        )

        url = reverse('application-list')
        res = self.client.get(url, {'state': 'not-a-real-state'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_owner_in_body_is_ignored(self):
        other = User.objects.create_user(username='bob', password='pw12345')
        url = reverse('application-list')
        data = {
            'title': 'Software Engineer I',
            'company': 'ACME',
            'date_applied': '2026-08-02',
            'state': ApplicationState.APPLIED,
            'link': '',
            'owner': other.id,
        }

        res = self.client.post(url, data, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created = Application.objects.get(id=res.data['id'])
        self.assertEqual(created.owner, self.user)


class ApplicationAnonymousTests(APITestCase):
    def test_anonymous_list_forbidden(self):
        url = reverse('application-list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_create_forbidden(self):
        url = reverse('application-list')
        data = {
            'title': 'Software Engineer I',
            'company': 'ACME',
            'date_applied': '2026-08-02',
            'state': ApplicationState.APPLIED,
            'link': '',
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class ApplicationOwnershipTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username='alice2', password='pw12345')
        self.bob = User.objects.create_user(username='bob2', password='pw12345')
        self.alices_app = Application.objects.create(
            title='Backend Engineer',
            company='Acme',
            date_applied='2026-08-01',
            state=ApplicationState.APPLIED,
            owner=self.alice,
        )

    def test_cannot_read_others_application(self):
        self.client.force_authenticate(self.bob)
        url = reverse('application-detail', args=[self.alices_app.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_edit_others_application(self):
        self.client.force_authenticate(self.bob)
        url = reverse('application-detail', args=[self.alices_app.id])
        res = self.client.patch(url, {'state': ApplicationState.REJECTED}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_others_application(self):
        self.client.force_authenticate(self.bob)
        url = reverse('application-detail', args=[self.alices_app.id])
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Application.objects.filter(id=self.alices_app.id).exists())


class AuthViewTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='carol', password='correct-password')

    def test_login_with_correct_credentials(self):
        url = reverse('auth-login')
        res = self.client.post(
            url, {'username': 'carol', 'password': 'correct-password'}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'carol')

    def test_login_with_bad_credentials(self):
        url = reverse('auth-login')
        res = self.client.post(
            url, {'username': 'carol', 'password': 'wrong-password'}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_rate_limited_after_repeated_failures(self):
        url = reverse('auth-login')
        for _ in range(5):
            self.client.post(
                url, {'username': 'carol', 'password': 'wrong-password'}, format='json',
            )

        res = self.client.post(
            url, {'username': 'carol', 'password': 'wrong-password'}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
