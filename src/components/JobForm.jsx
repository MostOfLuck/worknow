import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Валидация с помощью Zod
const jobSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(100, 'Максимум 100 символов'),
  salary: z.string().regex(/^\d+$/, 'Можно вводить только цифры'),
  cityId: z.number({ required_error: 'Выберите город' }),
  phone: z.string().regex(/^\d+$/, 'Можно вводить только цифры').min(7, 'Минимум 7 цифр'),
  description: z.string().min(10, 'Минимум 10 символов').max(2000, 'Максимум 2000 символов'),
});

const JobForm = ({ onJobCreated }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      salary: '',
      cityId: undefined,
      phone: '',
      description: '',
    },
  });

  const selectedCityId = watch('cityId');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/cities');
        const formattedCities = response.data.map((city) => ({
          value: city.id,
          label: city.name,
        }));
        setCities(formattedCities);
      } catch (error) {
        console.error('Ошибка получения городов:', error);
        toast.error('Не удалось загрузить города!');
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('Вы должны быть авторизованы!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/jobs', {
        ...data,
        cityId: parseInt(data.cityId),
        userId: user.id,
      });

      toast.success('Объявление успешно создано!');

      reset();

      if (onJobCreated) {
        onJobCreated(response.data);
      }

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Ошибка при создании объявления:', error.response?.data || error.message);

      if (error.response && error.response.data) {
        if (error.response.data.error) {
          const errorMessage = error.response.data.error;

          if (errorMessage.includes('Вы сможете опубликовать новое объявление')) {
            // Извлекаем время ожидания
            const match = errorMessage.match(/через (\d+)м (\d+)с/);
            if (match) {
              const minutesLeft = match[1];
              const secondsLeft = match[2];

              toast.error(`Подождите ${minutesLeft} мин ${secondsLeft} сек перед созданием нового объявления.`);
            } else {
              toast.error(errorMessage);
            }
          } else if (errorMessage.includes('Вы уже разместили 10 объявлений')) {
            // Выводим ошибку о превышении лимита
            toast.error('Достигнут лимит в 10 вакансий. Удалите одно из них, прежде чем создать новое.');
          } else {
            toast.error(errorMessage);
          }
        } else if (error.response.data.errors) {
          // Показываем каждую ошибку отдельно
          error.response.data.errors.forEach((err) => {
            toast.error(`${err}`);
          });
        } else {
          toast.error('Ошибка при создании объявления. Попробуйте позже.');
        }
      } else {
        toast.error('Ошибка при создании объявления. Попробуйте позже.');
      }
    }
  };

  return (
    <div className="flex-grow-1 d-flex justify-content-center align-items-center px-4">
      <div className="job-form my-5 w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl p-6 bg-white rounded-lg ">
        <h1 className="text-2xl font-bold mb-4 mt-5 text-center">{t('create_new_advertisement')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Название вакансии */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 mb-2">
              {t('job_title')}
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={`bg-white w-full border px-3 py-2 rounded ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('write_job_title')}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Зарплата */}
          <div className="mb-4">
            <label htmlFor="salary" className="block text-gray-700 mb-2">
              {t('salary_per_hour')}
            </label>
            <input
              id="salary"
              type="text"
              {...register('salary')}
              className={`bg-white w-full border px-3 py-2 rounded ${
                errors.salary ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('write_salary')}
            />
            {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary.message}</p>}
          </div>

          {/* Город */}
          <div className="mb-4">
            <label htmlFor="cityId" className="block text-gray-700 mb-2">
              {t('location')}
            </label>
            {loading ? (
              <Skeleton height={40} />
            ) : (
              <Select
                options={cities}
                value={cities.find((city) => city.value === selectedCityId) || null}
                onChange={(option) => setValue('cityId', option?.value)}
                placeholder="Выберите город"
                classNamePrefix="react-select"
                isClearable
              />
            )}
            {errors.cityId && <p className="text-red-500 text-sm mt-1">{errors.cityId.message}</p>}
          </div>

          {/* Телефон */}
          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-700 mb-2">
              {t('phone_number')}
            </label>
            <input
              id="phone"
              type="text"
              {...register('phone')}
              className={`bg-white w-full border px-3 py-2 rounded ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('write_phone_number')}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          {/* Описание */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 mb-2">
              {t('description')}
            </label>
            <textarea
              id="description"
              {...register('description')}
              className="bg-white w-full border px-3 py-2 rounded border-gray-300"
              rows="5"
              placeholder={t('write_job_description')}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full text-white px-4 py-2 rounded">
            {t('create')}
          </button>
        </form>
      </div>
    </div>
  );
};

export { JobForm };
